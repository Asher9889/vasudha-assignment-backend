import { DATASET_DOMAINS, DATASET_VISUALIZATION_TYPES, DATASET_STATUS, DATASET_COLUMN_TYPES } from "./dataset.constants";

type TDatasetDomain = (typeof DATASET_DOMAINS)[keyof typeof DATASET_DOMAINS];
type TDatasetVisualizationType = (typeof DATASET_VISUALIZATION_TYPES)[keyof typeof DATASET_VISUALIZATION_TYPES];
type TDatasetStatus = (typeof DATASET_STATUS)[keyof typeof DATASET_STATUS];
type TDatasetColumnType = (typeof DATASET_COLUMN_TYPES)[keyof typeof DATASET_COLUMN_TYPES];


interface ParsedColumn {
    name: string;
    type: TDatasetColumnType;
}

interface WrongRow {
    rowNumber: number;
    row: Record<string, unknown>;
    errors: { field: string; message: string }[];
}

interface ParsedCSV {
    results: Record<string, unknown>[];
    wrongData: WrongRow[];
    columns: ParsedColumn[];
    rowCount: number;
    validCount: number;
    wrongCount: number;
}

export type { TDatasetDomain, TDatasetVisualizationType, TDatasetStatus, TDatasetColumnType, ParsedCSV, ParsedColumn, WrongRow };