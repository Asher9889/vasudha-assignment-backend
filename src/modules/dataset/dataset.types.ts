import z from "zod";
import { DATASET_DOMAINS, DATASET_TEMPLATE_TYPES, DATASET_STATUS, DATASET_COLUMN_TYPES, DATASET_CHART_TYPES } from "./dataset.constants";
import { createDatasetSchema, getAllDatasetsQuerySchema, updateDatasetStatusSchema } from "./dataset.schema";

type TDatasetDomain = (typeof DATASET_DOMAINS)[keyof typeof DATASET_DOMAINS];
type TDatasetTemplateType = (typeof DATASET_TEMPLATE_TYPES)[keyof typeof DATASET_TEMPLATE_TYPES];
type TDatasetChartType = (typeof DATASET_CHART_TYPES)[keyof typeof DATASET_CHART_TYPES];
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
    fileKey: string;
    results: Record<string, unknown>[];
    wrongData: WrongRow[];
    columns: ParsedColumn[];
    rowCount: number;
    validCount: number;
    wrongCount: number;
}

type TCreateDatasetSchemaDTO = z.infer<typeof createDatasetSchema>;
type TGetAllDatasetsQueryDTO = z.infer<typeof getAllDatasetsQuerySchema>;
type TUpdateDatasetStatusDTO = z.infer<typeof updateDatasetStatusSchema>;

export type { TCreateDatasetSchemaDTO, TGetAllDatasetsQueryDTO, TUpdateDatasetStatusDTO, TDatasetDomain, TDatasetTemplateType, TDatasetChartType, TDatasetStatus, TDatasetColumnType, ParsedCSV, ParsedColumn, WrongRow };