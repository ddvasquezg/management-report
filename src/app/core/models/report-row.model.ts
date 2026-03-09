export interface RawRow {
  [key: string]: unknown;
}

export interface ReportRow {
  nombre: string | null;
  lider: string | null;
  etapa: string | null;
  activity: string | null;
  observation: string | null;
  usoIA: boolean;
  iaAplica: boolean;
  indice: number | null;
}

export interface ProcessImprovementRow {
  item: string;
  description: string | null;
  problemType: string | null;
  impact: string | null;
  responsible: string | null;
}
