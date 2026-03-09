import { Component, computed, input, signal } from '@angular/core';
import { StageWithActivitiesAggregate } from '../../../../core/models/aggregates.model';
import { ColorClassPipe } from '../../../../shared/pipes/color-class.pipe';

@Component({
  selector: 'app-stage-activity-table',
  standalone: true,
  imports: [ColorClassPipe],
  templateUrl: './stage-activity-table.component.html',
  styleUrl: '../shared/data-table.scss',
})
export class StageActivityTableComponent {
  data = input<StageWithActivitiesAggregate[]>([]);
  globalAvg = input<number | null>(null);

  expandedRows = signal<Set<string>>(new Set());

  summary = computed(() => {
    const avg = this.globalAvg();
    if (avg === null || !this.data().length) return '';
    return `Prom: ${(avg * 100).toFixed(1)}%`;
  });

  pct(avg: number | null): number | null {
    return avg === null ? null : avg * 100;
  }

  toggleRow(etapa: string): void {
    const current = new Set(this.expandedRows());
    current.has(etapa) ? current.delete(etapa) : current.add(etapa);
    this.expandedRows.set(current);
  }

  isExpanded(etapa: string): boolean {
    return this.expandedRows().has(etapa);
  }
}
