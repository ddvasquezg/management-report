import { Component, inject, computed } from '@angular/core';
import { StageChartComponent } from '../stages/stage-chart.component';
import { LeaderChartComponent } from '../leaders/leader-chart.component';
import { ActivityChartComponent } from '../activities/activity-chart.component';
import { ReportStoreService } from '../../../../core/services/report-store.service';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [StageChartComponent, LeaderChartComponent, ActivityChartComponent],
  template: `
    <section class="charts-row">
      <app-stage-chart
        [data]="aggregates().byStage"
        [summaryText]="stageSummary()"
      />
      <app-leader-chart
        [data]="aggregates().byLeader"
        [summaryText]="leaderSummary()"
      />
      <app-activity-chart
        [data]="aggregates().byActivity"
        [summaryText]="activitySummary()"
      />
    </section>
  `,
  styles: [`
    .charts-row {
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeUp 0.45s 0.08s ease both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ChartsComponent {
  private store = inject(ReportStoreService);

  aggregates = this.store.aggregates;
  kpis = this.store.kpis;

  stageSummary = computed(() => {
    const avg = this.kpis().avgIndex;
    if (avg === null || !this.aggregates().byStage.length) return '';
    return `Prom: ${(avg * 100).toFixed(1)}%`;
  });

  leaderSummary = computed(() => {
    const avg = this.kpis().avgIndex;
    if (avg === null || !this.aggregates().byLeader.length) return '';
    return `Prom: ${(avg * 100).toFixed(1)}%`;
  });

  activitySummary = computed(() => {
    const avg = this.kpis().avgIndex;
    if (avg === null || !this.aggregates().byActivity.length) return '';
    return `Prom: ${(avg * 100).toFixed(1)}%`;
  });
}
