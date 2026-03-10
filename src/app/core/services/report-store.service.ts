import { Injectable, signal, computed } from '@angular/core';
import { ReportRow } from '../models/report-row.model';
import { ReportAggregates, KpiData } from '../models/aggregates.model';
import { ReportParserService } from './report-parser.service';
import { RawRow, ProcessImprovementRow } from '../models/report-row.model';

@Injectable({ providedIn: 'root' })
export class ReportStoreService {

  private _rawRows    = signal<RawRow[]>([]);
  private _processImprovements = signal<ProcessImprovementRow[]>([]);
  private _filterIa   = signal<boolean>(false);
  private _selectedSofters = signal<Set<string>>(new Set());
  private _selectedLeaders = signal<Set<string>>(new Set());
  private _isLoading  = signal<boolean>(false);
  private _errorMsg   = signal<string | null>(null);
  private _hasData    = signal<boolean>(false);

  readonly filterIa  = this._filterIa.asReadonly();
  readonly processImprovements = this._processImprovements.asReadonly();
  readonly selectedSofters = this._selectedSofters.asReadonly();
  readonly selectedLeaders = this._selectedLeaders.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMsg  = this._errorMsg.asReadonly();
  readonly hasData   = this._hasData.asReadonly();

  readonly baseRows = computed<ReportRow[]>(() =>
    this.parser.processRows(this._rawRows(), this._filterIa())
  );

  readonly rows = computed<ReportRow[]>(() => {
    const processed = this.baseRows();
    const selectedSofters = this._selectedSofters();
    const selectedLeaders = this._selectedLeaders();

    if (selectedSofters.size > 0) {
      // Filtrar solo por Softers seleccionados
      return processed.filter(row => row.nombre !== null && selectedSofters.has(row.nombre));
    }
    if (selectedLeaders.size > 0) {
      // Filtrar solo por líderes seleccionados
      return processed.filter(row => row.lider !== null && selectedLeaders.has(row.lider));
    }
    // Sin filtros, mostrar todo
    return processed;
  });

  readonly rowsForSofterFilter = computed<ReportRow[]>(() => {
    const processed = this.baseRows();
    const selectedLeaders = this._selectedLeaders();
    if (!selectedLeaders.size) return processed;
    return processed.filter(row => row.lider !== null && selectedLeaders.has(row.lider));
  });

  readonly kpis = computed<KpiData>(() =>
    this.parser.computeKpis(this.rows())
  );

  readonly aggregates = computed<ReportAggregates>(() =>
    this.parser.computeAggregates(this.rows())
  );

  // Devuelve los líderes asociados a los Softers seleccionados
  readonly leadersForSelectedSofters = computed<string[]>(() => {
    const processed = this.baseRows();
    const selectedSofters = this._selectedSofters();
    if (!selectedSofters.size) return [];
    // Filtrar filas por Softers seleccionados y extraer líderes únicos
    const leaders = processed
      .filter(row => row.nombre !== null && selectedSofters.has(row.nombre) && row.lider)
      .map(row => row.lider as string);
    return [...new Set(leaders)].sort();
  });

  // Devuelve todos los líderes o solo los de los Softers seleccionados
  readonly leadersForFilter = computed<string[]>(() => {
    const processed = this.baseRows();
    const selectedSofters = this._selectedSofters();
    if (!selectedSofters.size) {
      // Todos los líderes
      return [...new Set(processed.filter(row => row.lider).map(row => row.lider as string))].sort();
    }
    // Solo líderes de Softers seleccionados
    const leaders = processed
      .filter(row => row.nombre !== null && selectedSofters.has(row.nombre) && row.lider)
      .map(row => row.lider as string);
    return [...new Set(leaders)].sort();
  });

  // Devuelve todos los Softers o solo los de los líderes seleccionados
  readonly softersForFilter = computed<string[]>(() => {
    const processed = this.baseRows();
    const selectedLeaders = this._selectedLeaders();
    if (!selectedLeaders.size) {
      // Todos los Softers
      return [...new Set(processed.filter(row => row.nombre).map(row => row.nombre as string))].sort();
    }
    // Solo Softers de líderes seleccionados
    const softers = processed
      .filter(row => row.lider !== null && selectedLeaders.has(row.lider) && row.nombre)
      .map(row => row.nombre as string);
    return [...new Set(softers)].sort();
  });

  // Indica si el filtro de líderes debe estar bloqueado
  readonly isLeadersFilterBlocked = computed(() => this._selectedSofters().size > 0);

  constructor(private parser: ReportParserService) {}

  setRawRows(rows: RawRow[]): void {
    this._rawRows.set(rows);
    this._hasData.set(rows.length > 0);
  }

  setProcessImprovements(rows: ProcessImprovementRow[]): void {
    this._processImprovements.set(rows);
  }

  setFilterIa(value: boolean): void {
    this._filterIa.set(value);
  }

  toggleSofterSelection(name: string): void {
    const next = new Set(this._selectedSofters());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this._selectedSofters.set(next);
  }

  clearSofterSelection(): void {
    this._selectedSofters.set(new Set());
  }

  isSofterSelected(name: string): boolean {
    return this._selectedSofters().has(name);
  }

  toggleLeaderSelection(name: string): void {
    const next = new Set(this._selectedLeaders());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this._selectedLeaders.set(next);
  }

  clearLeaderSelection(): void {
    this._selectedLeaders.set(new Set());
  }

  isLeaderSelected(name: string): boolean {
    return this._selectedLeaders().has(name);
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }

  setError(msg: string | null): void {
    this._errorMsg.set(msg);
    if (msg) {
      setTimeout(() => this._errorMsg.set(null), 4000);
    }
  }
}
