import { Injectable } from '@angular/core';
import { RawRow, ReportRow } from '../models/report-row.model';
import {
  KpiData,
  ReportAggregates,
  LeaderAggregate,
  StageAggregate,
  ActivityAggregate,
  ActivityWithSoftersAggregate,
  StageWithActivitiesAggregate,
  ObservationAggregate,
} from '../models/aggregates.model';

/**
 * Fuente única de verdad para todas las variantes de nombres de columnas en CSV/Excel.
 * Existen múltiples variantes porque:
 * - Algunos exportadores truncan los encabezados (ejemplo: "Puntos Estimad" en vez de "Puntos Estimados").
 * - Archivos antiguos usan nombres cortos para columnas de líder ("Lider" vs "Lider En Cliente").
 * - Hay diferencias de mayúsculas/minúsculas entre formatos ("Nombre" vs "nombre").
 * - "Ejecuados" es un error tipográfico conocido que se preserva en algunos archivos fuente.
 */
const FIELD_KEYS = {
  nombre:           ['Nombre', 'nombre'],
  /** Full header in current exports; short header in legacy files. */
  lider:            ['Lider En Cliente', 'Lider'],
  etapa:            ['Etapa'],
  actividad:        ['Actividad', 'actividad'],
  observaciones:    ['Observaciones', 'observaciones'],
  usoIa:            ['Uso IA'],
  /** "Indice de Reduccion" is the truncated variant in some Excel exports. */
  indice:           ['Indice de Reduccion de Esfuerzo', 'Indice de Reduccion'],
  puntosEstimados:  ['Puntos Estimados', 'Puntos Estimad'],
  /** "Ejecuados" is an intentional typo variant; "Ejecutad" is a truncated header. */
  puntosEjecutados: ['Puntos Ejecuados', 'Puntos Ejecutad', 'Puntos Ejecutado'],
} as const;

@Injectable({ providedIn: 'root' })
export class ReportParserService {

  private sortByAvgDesc<T extends { avg: number | null }>(items: T[]): T[] {
    return items.sort((a, b) => {
      if (a.avg === null && b.avg === null) return 0;
      if (a.avg === null) return 1;
      if (b.avg === null) return -1;
      return b.avg - a.avg;
    });
  }

  /**
   * Devuelve el primer valor no nulo/no indefinido para las variantes de clave dadas.
   * Usado para campos numéricos donde `0` es un valor válido y no debe omitirse.
   */
  private firstValue(row: RawRow, keys: readonly string[]): unknown {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) return row[k];
    }
    return undefined;
  }

  /**
   * Devuelve el primer valor "truthy" para las variantes de clave dadas, o `null`.
   * Usado para campos de texto donde una cadena vacía debe permitir probar la siguiente variante.
   */
  private firstTruthy(row: RawRow, keys: readonly string[]): unknown {
    for (const k of keys) {
      if (row[k]) return row[k];
    }
    return null;
  }

  /**
   * Convierte un valor de celda crudo a número, normalizando formatos comunes:
   * - Elimina signos `%` al final (columnas de porcentaje).
   * - Reemplaza comas por puntos (separador decimal europeo).
   * - Elimina espacios en blanco alrededor.
   * Devuelve `null` para entradas vacías, no numéricas o nulas.
   */
  private parseNum(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    const s = String(v).trim().replace('%', '').replace(',', '.');
    if (!s) return null;
    const n = Number(s);
    return isNaN(n) ? null : n;
  }

  /**
   * Calcula el índice de reducción de esfuerzo para una fila de datos cruda.
   *
   * Estrategia de resolución (primer match gana):
   * 1. **Campo directo**: si alguna columna de `FIELD_KEYS.indice` está presente y es numérica,
   *    se retorna tal cual (la fuente ya calculó el índice).
   * 2. **Derivado**: calcula `(puntosEstimados - puntosEjecutados) / puntosEstimados`
   *    usando las columnas `FIELD_KEYS.puntosEstimados` / `FIELD_KEYS.puntosEjecutados`.
   *
   * Devuelve `null` si ningún camino produce un resultado válido, o si los puntos estimados
   * son cero (protección de división).
   *
   * @nota Las claves ya están trimeadas por `normalizeRows` antes de llamar este método.
   */
  computeIndex(r: RawRow): number | null {
    const idxNum = this.parseNum(this.firstValue(r, FIELD_KEYS.indice));
    if (idxNum !== null) return idxNum;
    const est  = this.parseNum(this.firstValue(r, FIELD_KEYS.puntosEstimados));
    const exec = this.parseNum(this.firstValue(r, FIELD_KEYS.puntosEjecutados));
    if (est === null || est === 0 || exec === null) return null;
    return (est - exec) / est;
  }

  private normalizeRows(rows: RawRow[]): RawRow[] {
    return rows.map(r => {
      const n: RawRow = {};
      for (const k in r) n[k.trim()] = r[k];
      return n;
    });
  }

  /**
   * Normaliza filas de hoja de cálculo crudas a objetos tipados `ReportRow`.
   *
   * La detección de uso de IA utiliza un **match de prefijo** (`startsWith('s')`) para manejar
   * "Si", "Sí", "si", "SÍ" sin normalización adicional.
   * `iaAplica` es `true` solo cuando la celda es explícitamente `"si"` o `"no"`,
   * excluyendo filas donde la columna está vacía o contiene texto libre.
   *
   * Todas las búsquedas de campos delegan a `FIELD_KEYS` para manejar nombres de columna multivariantes.
   */
  processRows(rows: RawRow[], filterIa = false): ReportRow[] {
    const normalized = this.normalizeRows(rows);
    const processed: ReportRow[] = normalized.map(r => {
      const iaRaw = (this.firstValue(r, FIELD_KEYS.usoIa) ?? '').toString().trim().toLowerCase();
      const iaAplica = iaRaw === 'si' || iaRaw === 'no';
      return {
        nombre:      this.firstTruthy(r, FIELD_KEYS.nombre)        as string | null,
        lider:       this.firstTruthy(r, FIELD_KEYS.lider)         as string | null,
        etapa:       this.firstTruthy(r, FIELD_KEYS.etapa)         as string | null,
        activity:    this.firstTruthy(r, FIELD_KEYS.actividad)     as string | null,
        observation: this.firstTruthy(r, FIELD_KEYS.observaciones) as string | null,
        usoIA:  iaRaw.startsWith('s'),
        iaAplica,
        indice: this.computeIndex(r),
      };
    });
    return filterIa ? processed.filter(x => x.usoIA) : processed;
  }

  /**
   * Calcula todos los agregados multidimensionales sobre las filas procesadas **en una sola pasada**.
   *
   * Cinco mapas acumuladores independientes se construyen simultáneamente:
   * - `byStageMap`: índice promedio + conteo de softers distintos por etapa.
   * - `byActivityMap`: índice promedio + conteo de softers distintos por actividad.
   * - `byLeaderMap`: promedio por líder con desglose anidado por softer y por etapa.
   * - `byStageWithActivitiesMap`: agregado por etapa con desglose anidado por actividad y
   *   por softer (respaldando las tablas de drill-down detalladas de etapa/actividad).
   * - `byObservationMap`: agrupa observaciones idénticas por softer, usando la clave
   *   `"{softer}__{observation}"` para evitar colisiones entre softers.
   *
   * **Las filas con índice `null` se excluyen completamente** de todos los acumuladores, incluyendo
   * los conjuntos de conteo de softers — solo las filas con índice computable contribuyen a cualquier métrica.
   *
   * Todos los arrays de resultados se ordenan de forma descendente por índice promedio usando `sortByAvgDesc`,
   * con entradas de promedio `null` al final.
   */
  computeAggregates(rows: ReportRow[]): ReportAggregates {
    const byStageMap: Record<string, { sum: number; count: number; softers: Set<string> }> = {};
    const byLeaderMap: Record<string, { sum: number; count: number; softers: Set<string>; bySofter: Record<string, { sum: number; count: number }>; byStage: Record<string, { sum: number; count: number; softers: Set<string> }> }> = {};
    const byActivityMap: Record<string, { sum: number; count: number; softers: Set<string> }> = {};
    const byStageWithActivitiesMap: Record<string, {
      sum: number;
      count: number;
      softers: Set<string>;
      bySofter: Record<string, { sum: number; count: number }>;
      activities: Record<string, {
        sum: number;
        count: number;
        softers: Set<string>;
        bySofter: Record<string, { sum: number; count: number }>;
      }>;
    }> = {};
    const byObservationMap: Record<string, { softer: string; observation: string; sum: number; count: number }> = {};

    rows.forEach(r => {
      const idx = r.indice;
      if (r.etapa) {
        if (!byStageMap[r.etapa]) byStageMap[r.etapa] = { sum: 0, count: 0, softers: new Set<string>() };
        if (idx !== null) {
          byStageMap[r.etapa].sum += idx;
          byStageMap[r.etapa].count++;
          if (r.nombre) byStageMap[r.etapa].softers.add(r.nombre);
        }
      }
      if (r.activity) {
        if (!byActivityMap[r.activity]) byActivityMap[r.activity] = { sum: 0, count: 0, softers: new Set<string>() };
        if (idx !== null) {
          byActivityMap[r.activity].sum += idx;
          byActivityMap[r.activity].count++;
          if (r.nombre) byActivityMap[r.activity].softers.add(r.nombre);
        }
      }
      if (r.etapa) {
        if (!byStageWithActivitiesMap[r.etapa]) {
          byStageWithActivitiesMap[r.etapa] = { sum: 0, count: 0, softers: new Set<string>(), bySofter: {}, activities: {} };
        }
        if (idx !== null) {
          byStageWithActivitiesMap[r.etapa].sum += idx;
          byStageWithActivitiesMap[r.etapa].count++;
          if (r.nombre) byStageWithActivitiesMap[r.etapa].softers.add(r.nombre);
          if (r.nombre) {
            if (!byStageWithActivitiesMap[r.etapa].bySofter[r.nombre]) {
              byStageWithActivitiesMap[r.etapa].bySofter[r.nombre] = { sum: 0, count: 0 };
            }
            byStageWithActivitiesMap[r.etapa].bySofter[r.nombre].sum += idx;
            byStageWithActivitiesMap[r.etapa].bySofter[r.nombre].count++;
          }
        }
        if (r.activity) {
          if (!byStageWithActivitiesMap[r.etapa].activities[r.activity]) {
            byStageWithActivitiesMap[r.etapa].activities[r.activity] = {
              sum: 0,
              count: 0,
              softers: new Set<string>(),
              bySofter: {},
            };
          }
          if (idx !== null) {
            byStageWithActivitiesMap[r.etapa].activities[r.activity].sum += idx;
            byStageWithActivitiesMap[r.etapa].activities[r.activity].count++;
            if (r.nombre) {
              byStageWithActivitiesMap[r.etapa].activities[r.activity].softers.add(r.nombre);
              if (!byStageWithActivitiesMap[r.etapa].activities[r.activity].bySofter[r.nombre]) {
                byStageWithActivitiesMap[r.etapa].activities[r.activity].bySofter[r.nombre] = { sum: 0, count: 0 };
              }
              byStageWithActivitiesMap[r.etapa].activities[r.activity].bySofter[r.nombre].sum += idx;
              byStageWithActivitiesMap[r.etapa].activities[r.activity].bySofter[r.nombre].count++;
            }
          }
        }
      }
      if (r.lider) {
        if (!byLeaderMap[r.lider]) {
          byLeaderMap[r.lider] = { sum: 0, count: 0, softers: new Set<string>(), bySofter: {}, byStage: {} };
        }
        if (idx !== null) {
          byLeaderMap[r.lider].sum += idx;
          byLeaderMap[r.lider].count++;
          if (r.nombre) byLeaderMap[r.lider].softers.add(r.nombre);
          if (r.nombre) {
            if (!byLeaderMap[r.lider].bySofter[r.nombre]) {
              byLeaderMap[r.lider].bySofter[r.nombre] = { sum: 0, count: 0 };
            }
            byLeaderMap[r.lider].bySofter[r.nombre].sum += idx;
            byLeaderMap[r.lider].bySofter[r.nombre].count++;
          }
        }
        if (r.etapa) {
          if (!byLeaderMap[r.lider].byStage[r.etapa])
            byLeaderMap[r.lider].byStage[r.etapa] = { sum: 0, count: 0, softers: new Set<string>() };
          if (idx !== null) {
            byLeaderMap[r.lider].byStage[r.etapa].sum += idx;
            byLeaderMap[r.lider].byStage[r.etapa].count++;
            if (r.nombre) byLeaderMap[r.lider].byStage[r.etapa].softers.add(r.nombre);
          }
        }
      }

      if (r.nombre && r.observation) {
        const obs = r.observation.trim();
        if (obs && idx !== null) {
          const key = `${r.nombre}__${obs.toLowerCase()}`;
          if (!byObservationMap[key]) {
            byObservationMap[key] = { softer: r.nombre, observation: obs, sum: 0, count: 0 };
          }
          byObservationMap[key].sum += idx;
          byObservationMap[key].count++;
        }
      }
    });

    const avg = (o: { sum: number; count: number }): number | null =>
      o.count ? o.sum / o.count : null;

    const byStage: StageAggregate[] = this.sortByAvgDesc(Object.keys(byStageMap).map(k => ({
      etapa: k,
      avg: avg(byStageMap[k]),
      softerCount: byStageMap[k].softers.size,
    })));

    const byLeader: LeaderAggregate[] = this.sortByAvgDesc(Object.keys(byLeaderMap).map(k => ({
      lider: k,
      avg: avg(byLeaderMap[k]),
      softerCount: byLeaderMap[k].softers.size,
      softers: Object.keys(byLeaderMap[k].bySofter)
        .map(name => ({
          name,
          total: byLeaderMap[k].bySofter[name].count,
        }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
      byStage: this.sortByAvgDesc(Object.keys(byLeaderMap[k].byStage).map(s => ({
        etapa: s,
        avg: avg(byLeaderMap[k].byStage[s]),
        softerCount: byLeaderMap[k].byStage[s].softers.size,
      }))),
    })));

    const byActivity: ActivityAggregate[] = this.sortByAvgDesc(Object.keys(byActivityMap).map(k => ({
      activity: k,
      avg: avg(byActivityMap[k]),
      softerCount: byActivityMap[k].softers.size,
    })));

    const byStageWithActivities: StageWithActivitiesAggregate[] = this.sortByAvgDesc(
      Object.keys(byStageWithActivitiesMap).map(stage => ({
        etapa: stage,
        avg: avg(byStageWithActivitiesMap[stage]),
        softerCount: byStageWithActivitiesMap[stage].softers.size,
        softers: Object.keys(byStageWithActivitiesMap[stage].bySofter)
          .map(name => ({
            name,
            total: byStageWithActivitiesMap[stage].bySofter[name].count,
          }))
          .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
        activities: this.sortByAvgDesc<ActivityWithSoftersAggregate>(
          Object.keys(byStageWithActivitiesMap[stage].activities).map(activity => ({
            activity,
            avg: avg(byStageWithActivitiesMap[stage].activities[activity]),
            softerCount: byStageWithActivitiesMap[stage].activities[activity].softers.size,
            softers: Object.keys(byStageWithActivitiesMap[stage].activities[activity].bySofter)
              .map(name => ({
                name,
                total: byStageWithActivitiesMap[stage].activities[activity].bySofter[name].count,
              }))
              .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
          }))
        ),
      }))
    );

    const byObservation: ObservationAggregate[] = this.sortByAvgDesc(
      Object.keys(byObservationMap).map(key => ({
        softer: byObservationMap[key].softer,
        observation: byObservationMap[key].observation,
        avg: avg(byObservationMap[key]),
        records: byObservationMap[key].count,
      }))
    );

    return { byStage, byLeader, byActivity, byStageWithActivities, byObservation };
  }

  computeKpis(rows: ReportRow[]): KpiData {
    const withIdx = rows.filter(r => r.indice !== null);
    const softers = new Set(withIdx.filter(r => r.nombre).map(r => r.nombre)).size;
    const stages  = new Set(withIdx.filter(r => r.etapa).map(r => r.etapa)).size;
    const avgIndex = withIdx.length
      ? withIdx.reduce((s, r) => s + r.indice!, 0) / withIdx.length
      : null;
    const iaRows = rows.filter(r => r.iaAplica);
    const iaPct = iaRows.length
      ? iaRows.filter(r => r.usoIA).length / iaRows.length * 100
      : null;
    return { softers, stages, avgIndex, iaPct };
  }
}
