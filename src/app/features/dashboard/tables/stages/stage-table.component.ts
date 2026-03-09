import { Component, input, computed } from '@angular/core';
import { StageAggregate } from '../../../../core/models/aggregates.model';
import { ColorClassPipe } from '../../../../shared/pipes/color-class.pipe';

@Component({
  selector: 'app-stage-table',
  standalone: true,
  imports: [ColorClassPipe],
  templateUrl: './stage-table.component.html',
  styleUrl: '../shared/data-table.scss',
})
export class StageTableComponent {
  data = input<StageAggregate[]>([]);
  globalAvg = input<number | null>(null);

  summary = computed(() => {
    const avg = this.globalAvg();
    if (avg === null || !this.data().length) return '';
    return `Prom: ${(avg * 100).toFixed(1)}%`;
  });

  pct(avg: number | null): number | null {
    return avg === null ? null : avg * 100;
  }

  barWidth(avg: number | null): string {
    if (avg === null) return '0%';
    return Math.min(avg * 100, 100) + '%';
  }
}
