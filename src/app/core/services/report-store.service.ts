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

    if (!selectedSofters.size && !selectedLeaders.size) return processed;

    return processed.filter(row => {
      const softerMatch = row.nombre !== null && selectedSofters.has(row.nombre);
      const leaderMatch = row.lider !== null && selectedLeaders.has(row.lider);
      return softerMatch || leaderMatch;
    });
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
