import z from "zod";
import mongoose from "mongoose";
import { DATASET_DOMAINS, DATASET_TEMPLATE_TYPES, DATASET_CHART_TYPES, DATASET_STATUS, DATASET_COLUMN_TYPES } from "./dataset.constants";

const fileSchema = z.object({
    originalName: z.string().min(1, { message: "File original name is required" }),
    mimeType: z.string().min(1, { message: "File MIME type is required" }),
    size: z.number().positive({ message: "File size must be a positive number" }),
});

const csvColumnSchema = z.object({
    name: z.string().min(1, { message: "Column name is required" }),
    type: z.enum(Object.values(DATASET_COLUMN_TYPES), { message: `Valid column types are: ${Object.values(DATASET_COLUMN_TYPES).join(", ")}` }),
});

const csvSchemaObject = z.object({
    columns: z.array(csvColumnSchema).min(1, { message: "At least one column is required" }),
});

const latLongVisualizationConfigSchema = z.object({
    latitudeColumn: z.string().min(1, { message: "Latitude column is required" }),
    longitudeColumn: z.string().min(1, { message: "Longitude column is required" }),
    valueColumn: z.string().min(1, { message: "Value column is required" }),
});

const stateWiseVisualizationConfigSchema = z.object({
    stateColumn: z.string().min(1, { message: "State column is required" }),
    valueColumn: z.string().min(1, { message: "Value column is required" }),
});

const timeSeriesVisualizationConfigSchema = z.object({
    xAxisColumn: z.string().min(1, { message: "X-axis column is required" }),
    valueColumn: z.string().min(1, { message: "Value column is required" }),
});

type TVisualizationConfigDTO = z.infer<typeof latLongVisualizationConfigSchema>
    | z.infer<typeof stateWiseVisualizationConfigSchema>
    | z.infer<typeof timeSeriesVisualizationConfigSchema>;

const TEMPLATE_CONFIG_REQUIREMENTS = {
    [DATASET_TEMPLATE_TYPES.LAT_LONG]: "latitudeColumn, longitudeColumn, and valueColumn",
    [DATASET_TEMPLATE_TYPES.STATE_WISE]: "stateColumn and valueColumn",
    [DATASET_TEMPLATE_TYPES.TIME_SERIES]: "xAxisColumn and valueColumn",
} as const;

const validateVisualizationConfigForTemplateType = (
    templateType: (typeof DATASET_TEMPLATE_TYPES)[keyof typeof DATASET_TEMPLATE_TYPES],
    visualizationConfig: TVisualizationConfigDTO,
): { valid: boolean; message: string } => {
    const schema = templateType === DATASET_TEMPLATE_TYPES.LAT_LONG
        ? latLongVisualizationConfigSchema
        : templateType === DATASET_TEMPLATE_TYPES.STATE_WISE
            ? stateWiseVisualizationConfigSchema
            : timeSeriesVisualizationConfigSchema;

    const result = schema.safeParse(visualizationConfig);
    if (result.success) {
        return { valid: true, message: "" };
    }

    return {
        valid: false,
        message: `visualizationConfig must have ${TEMPLATE_CONFIG_REQUIREMENTS[templateType]} for ${templateType} template`,
    };
};

const createDatasetSchema = z.object({
    fileKey: z.string().min(1, { message: "File key is required" }),
    title: z.string().min(1, { message: "Title is required" }).max(255, { message: "Title must be at most 255 characters" }),
    domain: z.enum(Object.values(DATASET_DOMAINS), { message: `Valid domains are: ${Object.values(DATASET_DOMAINS).join(", ")}` }),
    templateType: z.enum(Object.values(DATASET_TEMPLATE_TYPES), { message: `Valid template types are: ${Object.values(DATASET_TEMPLATE_TYPES).join(", ")}` }),
    chartType: z.enum(Object.values(DATASET_CHART_TYPES), { message: `Valid chart types are: ${Object.values(DATASET_CHART_TYPES).join(", ")}` }),
    uploadedBy: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Please provide a valid uploadedBy ID" }),
    status: z.enum(Object.values(DATASET_STATUS), { message: `Valid status values are: ${Object.values(DATASET_STATUS).join(", ")}` }).default(DATASET_STATUS.PENDING),
    file: fileSchema,
    csvSchema: csvSchemaObject,
    visualizationConfig: z.union([
        latLongVisualizationConfigSchema,
        stateWiseVisualizationConfigSchema,
        timeSeriesVisualizationConfigSchema,
    ]),
    rowCount: z.number().int().positive({ message: "Row count must be a positive integer" }),
    approvedBy: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Please provide a valid approvedBy ID" }).nullable().default(null),
    approvedAt: z.coerce.date().nullable().default(null),
    publishedAt: z.coerce.date().nullable().default(null),
}).superRefine((data, ctx) => {
    if (data.templateType === "LAT_LONG") {
        const result = latLongVisualizationConfigSchema.safeParse(data.visualizationConfig);
        if (!result.success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "visualizationConfig must have latitudeColumn, longitudeColumn, and valueColumn for LAT_LONG template", path: ["visualizationConfig"] });
        }
    } else if (data.templateType === "STATE_WISE") {
        const result = stateWiseVisualizationConfigSchema.safeParse(data.visualizationConfig);
        if (!result.success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "visualizationConfig must have stateColumn and valueColumn for STATE_WISE template", path: ["visualizationConfig"] });
        }
    } else if (data.templateType === "TIME_SERIES") {
        const result = timeSeriesVisualizationConfigSchema.safeParse(data.visualizationConfig);
        if (!result.success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "visualizationConfig must have xAxisColumn and valueColumn for TIME_SERIES template", path: ["visualizationConfig"] });
        }
    }
});

const updateDatasetStatusSchema = z.object({
    status: z.enum([DATASET_STATUS.APPROVED, DATASET_STATUS.REJECTED], { message: `Valid status values are: ${DATASET_STATUS.APPROVED}, ${DATASET_STATUS.REJECTED}` }),
    rejectionReason: z.string().trim().max(500, { message: "Rejection reason must be at most 500 characters" }).optional(),
}).superRefine((data, ctx) => {
    if (data.status === DATASET_STATUS.REJECTED && !data.rejectionReason) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "rejectionReason is required when rejecting a dataset", path: ["rejectionReason"] });
    }
});

const updateDatasetSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }).max(255, { message: "Title must be at most 255 characters" }).optional(),
    domain: z.enum(Object.values(DATASET_DOMAINS), { message: `Valid domains are: ${Object.values(DATASET_DOMAINS).join(", ")}` }).optional(),
    templateType: z.enum(Object.values(DATASET_TEMPLATE_TYPES), { message: `Valid template types are: ${Object.values(DATASET_TEMPLATE_TYPES).join(", ")}` }).optional(),
    chartType: z.enum(Object.values(DATASET_CHART_TYPES), { message: `Valid chart types are: ${Object.values(DATASET_CHART_TYPES).join(", ")}` }).optional(),
    visualizationConfig: z.union([
        latLongVisualizationConfigSchema,
        stateWiseVisualizationConfigSchema,
        timeSeriesVisualizationConfigSchema,
    ]).optional(),
}).superRefine((data, ctx) => {
    if (!data.title && !data.domain && !data.templateType && !data.chartType && !data.visualizationConfig) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one of title, domain, templateType, chartType, or visualizationConfig is required for update" });
        return;
    }

    if (data.templateType && data.visualizationConfig) {
        const configResult = validateVisualizationConfigForTemplateType(data.templateType, data.visualizationConfig);
        if (!configResult.valid) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: configResult.message, path: ["visualizationConfig"] });
        }
    }
});

const datasetIdParamSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Please provide a valid dataset ID" }),
});

const getAllDatasetsQuerySchema = z.object({
    page: z.coerce.number().min(1, { message: "Page must be at least 1" }).default(1),
    limit: z.coerce.number().min(1, { message: "Limit must be at least 1" }).max(50, { message: "Limit must be at most 50" }).default(20),
    domain: z.enum(Object.values(DATASET_DOMAINS), { message: `Valid domains are: ${Object.values(DATASET_DOMAINS).join(", ")}` }).optional(),
    status: z.enum(Object.values(DATASET_STATUS), { message: `Valid status values are: ${Object.values(DATASET_STATUS).join(", ")}` }).optional(),
    search: z.string().trim().min(1, { message: "Search must not be empty" }).optional(),
    sortBy: z.enum(["createdAt", "title", "domain"], { message: "Valid sort fields are: createdAt, title, domain" }).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"], { message: "Valid sort orders are: asc, desc" }).default("desc"),
});

export {
    createDatasetSchema,
    updateDatasetSchema,
    updateDatasetStatusSchema,
    datasetIdParamSchema,
    getAllDatasetsQuerySchema,
    latLongVisualizationConfigSchema,
    stateWiseVisualizationConfigSchema,
    timeSeriesVisualizationConfigSchema,
    validateVisualizationConfigForTemplateType,
};
