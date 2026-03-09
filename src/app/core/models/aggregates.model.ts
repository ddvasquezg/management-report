export interface StageAggregate {
  etapa: string;
  avg: number | null;
}

export interface LeaderAggregate {
  lider: string;
  avg: number | null;
  byStage: StageAggregate[];
}

export interface ReportAggregates {
  byStage: StageAggregate[];
  byLeader: LeaderAggregate[];
}

export interface KpiData {
  softers: number;
  stages: number;
  avgIndex: number | null;
  iaPct: number | null;
}
