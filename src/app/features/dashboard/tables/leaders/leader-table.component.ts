import { Component, input, computed, signal } from '@angular/core';
import { LeaderAggregate, StageAggregate } from '../../../../core/models/aggregates.model';
import { ColorClassPipe } from '../../../../shared/pipes/color-class.pipe';

@Component({
  selector: 'app-leader-table',
  standalone: true,
  imports: [ColorClassPipe],
  templateUrl: './leader-table.component.html',
  styleUrl: '../shared/data-table.scss',
})
export class LeaderTableComponent {
  data = input<LeaderAggregate[]>([]);
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

  toggleRow(lider: string): void {
    const current = new Set(this.expandedRows());
    current.has(lider) ? current.delete(lider) : current.add(lider);
    this.expandedRows.set(current);
  }

  isExpanded(lider: string): boolean {
    return this.expandedRows().has(lider);
  }

  measuredStages(stages: StageAggregate[]): StageAggregate[] {
    return stages.filter(stage => stage.avg !== null);
  }
}
