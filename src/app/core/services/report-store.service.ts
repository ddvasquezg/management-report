import { Injectable, signal, computed } from '@angular/core';
import { ReportRow } from '../models/report-row.model';
import { ReportAggregates, KpiData } from '../models/aggregates.model';
import { ReportParserService } from './report-parser.service';
import { RawRow } from '../models/report-row.model';

@Injectable({ providedIn: 'root' })
export class ReportStoreService {

  private _rawRows    = signal<RawRow[]>([]);
  private _filterIa   = signal<boolean>(false);
  private _isLoading  = signal<boolean>(false);
  private _errorMsg   = signal<string | null>(null);
  private _hasData    = signal<boolean>(false);

  readonly filterIa  = this._filterIa.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMsg  = this._errorMsg.asReadonly();
  readonly hasData   = this._hasData.asReadonly();

  readonly rows = computed<ReportRow[]>(() =>
    this.parser.processRows(this._rawRows(), this._filterIa())
  );

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

  setFilterIa(value: boolean): void {
    this._filterIa.set(value);
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
