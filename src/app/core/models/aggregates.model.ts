export interface StageAggregate {
  etapa: string;
  avg: number | null;
  softerCount: number;
}

export interface ActivityAggregate {
  activity: string;
  avg: number | null;
  softerCount: number;
}

export interface StageWithActivitiesAggregate {
  etapa: string;
  avg: number | null;
  softerCount: number;
  activities: ActivityAggregate[];
}

export interface LeaderAggregate {
  lider: string;
  avg: number | null;
  softerCount: number;
  byStage: StageAggregate[];
}

export interface ReportAggregates {
  byStage: StageAggregate[];
  byLeader: LeaderAggregate[];
  byActivity: ActivityAggregate[];
  byStageWithActivities: StageWithActivitiesAggregate[];
}

export interface KpiData {
  softers: number;
  stages: number;
  avgIndex: number | null;
  iaPct: number | null;
}
