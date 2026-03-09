import { Injectable } from '@angular/core';
import { ReportRow } from '../models/report-row.model';
import { ReportAggregates } from '../models/aggregates.model';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportCsv(rows: ReportRow[], aggregates: ReportAggregates): void {
    let csv = 'Tipo,Clave,Promedio(%)\n';
    aggregates.byStage.forEach(s =>
      csv += `Etapa,${this.escapeCsv(s.etapa)},${this.formatPercent(s.avg)}\n`
    );
    aggregates.byLeader.forEach(l => {
      csv += `Lider,${this.escapeCsv(l.lider)},${this.formatPercent(l.avg)}\n`;
      l.byStage.forEach(s =>
        csv += `Lider-Etapa,${this.escapeCsv(l.lider + ' | ' + s.etapa)},${this.formatPercent(s.avg)}\n`
      );
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'report-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsv(s: string | null): string {
    return s == null ? '' : `"${String(s).replace(/"/g, '""')}"`;
  }

  private formatPercent(v: number | null): string {
    return v === null ? '' : (v * 100).toFixed(2);
  }
}
