export interface RawRow {
  [key: string]: unknown;
}

export interface ReportRow {
  nombre: string | null;
  lider: string | null;
  etapa: string | null;
  usoIA: boolean;
  iaAplica: boolean;
  indice: number | null;
}
