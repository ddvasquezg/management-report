import { Injectable } from '@angular/core';
import { RawRow, ReportRow } from '../models/report-row.model';
import {
  KpiData,
  ReportAggregates,
  LeaderAggregate,
  StageAggregate,
  ActivityAggregate,
  StageWithActivitiesAggregate,
} from '../models/aggregates.model';


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

  private parseNum(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    const s = String(v).trim().replace('%', '').replace(',', '.');
    if (!s) return null;
    const n = Number(s);
    return isNaN(n) ? null : n;
  }

  computeIndex(r: RawRow): number | null {
    const idxField = r['Indice de Reduccion de Esfuerzo'] ?? r['Indice de Reduccion'] ?? r['Indice de Reduccion '];
    const idxNum = this.parseNum(idxField);
    if (idxNum !== null) return idxNum;
    const est  = this.parseNum(r['Puntos Estimados'] || r['Puntos Estimad'] || r['Puntos Estimad ']);
    const exec = this.parseNum(r['Puntos Ejecuados'] || r['Puntos Ejecutad'] || r['Puntos Ejecutado']);
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

  processRows(rows: RawRow[], filterIa = false): ReportRow[] {
    const normalized = this.normalizeRows(rows);
    const processed: ReportRow[] = normalized.map(r => {
      const iaRaw = (r['Uso IA'] ?? '').toString().trim().toLowerCase();
      const iaAplica = iaRaw === 'si' || iaRaw === 'no';
      return {
        nombre: (r['Nombre'] || r['nombre'] || null) as string | null,
        lider:  (r['Lider En Cliente'] || r['Lider'] || null) as string | null,
        etapa:  (r['Etapa'] || null) as string | null,
        activity: (r['Actividad'] || r['actividad'] || null) as string | null,
        usoIA:  iaRaw.startsWith('s'),
        iaAplica,
        indice: this.computeIndex(r),
      };
    });
    return filterIa ? processed.filter(x => x.usoIA) : processed;
  }

  computeAggregates(rows: ReportRow[]): ReportAggregates {
    const byStageMap: Record<string, { sum: number; count: number; softers: Set<string> }> = {};
    const byLeaderMap: Record<string, { sum: number; count: number; softers: Set<string>; byStage: Record<string, { sum: number; count: number; softers: Set<string> }> }> = {};
    const byActivityMap: Record<string, { sum: number; count: number; softers: Set<string> }> = {};
    const byStageWithActivitiesMap: Record<string, { sum: number; count: number; softers: Set<string>; activities: Record<string, { sum: number; count: number; softers: Set<string> }> }> = {};

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
          byStageWithActivitiesMap[r.etapa] = { sum: 0, count: 0, softers: new Set<string>(), activities: {} };
        }
        if (idx !== null) {
          byStageWithActivitiesMap[r.etapa].sum += idx;
          byStageWithActivitiesMap[r.etapa].count++;
          if (r.nombre) byStageWithActivitiesMap[r.etapa].softers.add(r.nombre);
        }
        if (r.activity) {
          if (!byStageWithActivitiesMap[r.etapa].activities[r.activity]) {
            byStageWithActivitiesMap[r.etapa].activities[r.activity] = { sum: 0, count: 0, softers: new Set<string>() };
          }
          if (idx !== null) {
            byStageWithActivitiesMap[r.etapa].activities[r.activity].sum += idx;
            byStageWithActivitiesMap[r.etapa].activities[r.activity].count++;
            if (r.nombre) byStageWithActivitiesMap[r.etapa].activities[r.activity].softers.add(r.nombre);
          }
        }
      }
      if (r.lider) {
        if (!byLeaderMap[r.lider]) {
          byLeaderMap[r.lider] = { sum: 0, count: 0, softers: new Set<string>(), byStage: {} };
        }
        if (idx !== null) {
          byLeaderMap[r.lider].sum += idx;
          byLeaderMap[r.lider].count++;
          if (r.nombre) byLeaderMap[r.lider].softers.add(r.nombre);
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
        activities: this.sortByAvgDesc(
          Object.keys(byStageWithActivitiesMap[stage].activities).map(activity => ({
            activity,
            avg: avg(byStageWithActivitiesMap[stage].activities[activity]),
            softerCount: byStageWithActivitiesMap[stage].activities[activity].softers.size,
          }))
        ),
      }))
    );

    return { byStage, byLeader, byActivity, byStageWithActivities };
  }

  computeKpis(rows: ReportRow[]): KpiData {
    const softers = new Set(rows.filter(r => r.nombre).map(r => r.nombre)).size;
    const stages  = new Set(rows.filter(r => r.etapa ).map(r => r.etapa )).size;
    const withIdx = rows.filter(r => r.indice !== null);
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
