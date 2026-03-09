import { Component, computed, input } from '@angular/core';
import { ObservationAggregate } from '../../../../core/models/aggregates.model';

@Component({
  selector: 'app-observations-table',
  standalone: true,
  templateUrl: './observations-table.component.html',
  styleUrl: '../shared/data-table.scss',
})
export class ObservationsTableComponent {
  data = input<ObservationAggregate[]>([]);

  rowsWithData = computed(() => this.data().filter(item => item.avg !== null));

  pct(avg: number | null): number | null {
    return avg === null ? null : avg * 100;
  }

  status(avg: number | null): string {
    if (avg === null) return 'Sin dato';
    const pct = avg * 100;
    if (pct >= 40) return 'Bien';
    if (pct >= 20) return 'Regular';
    return 'Mal';
  }

  statusClass(avg: number | null): string {
    if (avg === null) return '';
    const pct = avg * 100;
    if (pct >= 40) return 'positive';
    if (pct >= 20) return 'neutral';
    return 'negative';
  }
}
