export type DataValue = string | number | boolean | null | undefined;
export type DataRow = Record<string, DataValue>;

export interface ProcessedData {
  headers: string[];
  rows: DataRow[];
  summary: {
    rowCount: number;
    colCount: number;
    types: Record<string, string>;
  };
}

export interface DataInsight {
  title: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
}
