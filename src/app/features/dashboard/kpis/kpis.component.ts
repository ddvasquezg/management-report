import { Component, inject, OnInit, effect } from '@angular/core';
import { ReportStoreService } from '../../../core/services/report-store.service';
import { KpiData } from '../../../core/models/aggregates.model';

interface KpiDisplay {
  icon: string;
  label: string;
  raw: number | null;
  display: string;
  accent: boolean;
  cssClass: string;
}

@Component({
  selector: 'app-kpis',
  standalone: true,
  templateUrl: './kpis.component.html',
  styleUrl: './kpis.component.scss',
})
export class KpisComponent {
  private store = inject(ReportStoreService);

  kpiItems: KpiDisplay[] = [];

  constructor() {
    effect(() => {
      const kpis = this.store.kpis();
      this.kpiItems = this.buildKpiItems(kpis);
    });
  }

  private buildKpiItems(kpis: KpiData): KpiDisplay[] {
    const avgPct = kpis.avgIndex !== null ? kpis.avgIndex * 100 : null;
    return [
      {
        icon: '👤', label: 'Softers Medidos',
        raw: kpis.softers, display: this.animateStr(kpis.softers, 0, ''),
        accent: false, cssClass: 'kpi-value',
      },
      {
        icon: '📋', label: 'Etapas Cubiertas',
        raw: kpis.stages, display: this.animateStr(kpis.stages, 0, ''),
        accent: false, cssClass: 'kpi-value',
      },
      {
        icon: '📈', label: 'Promedio General',
        raw: avgPct, display: avgPct === null ? '—' : avgPct.toFixed(1) + '%',
        accent: true, cssClass: 'kpi-value ' + this.colorClass(avgPct),
      },
      {
        icon: '🤖', label: 'Uso IA',
        raw: kpis.iaPct, display: kpis.iaPct === null ? '—' : kpis.iaPct.toFixed(1) + '%',
        accent: false, cssClass: 'kpi-value',
      },
    ];
  }

  private animateStr(value: number, decimals: number, suffix: string): string {
    if (value === null) return '—';
    return value.toFixed(decimals) + suffix;
  }

  private colorClass(pct: number | null): string {
    if (pct === null) return '';
    return pct >= 40 ? 'positive' : pct >= 20 ? 'neutral' : 'negative';
  }
}
