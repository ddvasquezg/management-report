import { Component, inject } from '@angular/core';
import { KpisComponent } from './kpis/kpis.component';
import { ChartsComponent } from './charts/composition/charts.component';
import { TablesComponent } from './tables/composition/tables.component';
import { ReportStoreService } from '../../core/services/report-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [KpisComponent, ChartsComponent, TablesComponent],
  styles: [`
    :host { display: flex; flex-direction: column; gap: 32px; }
  `],
  template: `
    @if (store.hasData()) {
      <app-kpis />
      <app-charts />
      <app-tables />
    }
  `,
})
export class DashboardComponent {
  store = inject(ReportStoreService);
}
