import { Component, inject } from '@angular/core';
import { CollaboratorsComponent } from '../collaborators/collaborators.component';
import { LeadersFilterComponent } from '../leaders-filter/leaders-filter.component';
import { StageTableComponent } from '../stages/stage-table.component';
import { LeaderTableComponent } from '../leaders/leader-table.component';
import { StageActivityTableComponent } from '../stages/stage-activity-table.component';
import { ProcessImprovementsComponent } from '../process-improvements/process-improvements.component';
import { ReportStoreService } from '../../../../core/services/report-store.service';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [
    CollaboratorsComponent,
    LeadersFilterComponent,
    StageTableComponent,
    LeaderTableComponent,
    StageActivityTableComponent,
    ProcessImprovementsComponent,
  ],
  template: `
    <section class="tables-row">
      <app-collaborators [rows]="store.baseRows()" />
      <app-leaders-filter [rows]="store.baseRows()" />
      <app-stage-table   [data]="store.aggregates().byStage"  [globalAvg]="store.kpis().avgIndex" />
      <app-leader-table  [data]="store.aggregates().byLeader" [globalAvg]="store.kpis().avgIndex" />
      <app-stage-activity-table
        class="activities-block"
        [data]="store.aggregates().byStageWithActivities"
        [globalAvg]="store.kpis().avgIndex"
      />
      @if (store.processImprovements().length) {
        <app-process-improvements
          class="observations-block"
          [data]="store.processImprovements()"
        />
      }
    </section>
  `,
  styles: [`
    .tables-row {
      display: grid;
      grid-template-columns: 210px 210px 1fr 1fr;
      gap: 36px;
      animation: fadeUp 0.45s 0.16s ease both;
    }
    .activities-block {
      grid-column: 1 / -1;
    }
    .observations-block {
      grid-column: 1 / -1;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 1100px) {
      .tables-row { grid-template-columns: 1fr 1fr; row-gap: 36px; }
      .activities-block { grid-column: 1 / -1; }
      .observations-block { grid-column: 1 / -1; }
    }
    @media (max-width: 768px) { .tables-row { grid-template-columns: 1fr; row-gap: 36px; } }
  `]
})
export class TablesComponent {
  store = inject(ReportStoreService);
}
