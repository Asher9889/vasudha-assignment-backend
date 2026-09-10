import mongoose from "mongoose";
import { TDatasetDomain, TDatasetVisualizationType, TDatasetStatus, TDatasetColumnType } from "./dataset.types";
import { DATASET_DOMAINS, DATASET_VISUALIZATION_TYPES, DATASET_STATUS, DATASET_COLUMN_TYPES } from "./dataset.constants";


type TVisualizationConfig = { latitudeColumn: string; longitudeColumn: string; valueColumn: string; }
    | { stateColumn: string; valueColumn: string; }
    | { xAxisColumn: string; valueColumn: string; };

interface IDataset extends mongoose.Document {
    title: string;
    domain: TDatasetDomain;
    visualizationType: TDatasetVisualizationType;
    uploadedBy: mongoose.Types.ObjectId;
    status: TDatasetStatus;
    rejectionReason?: string;
    file: {
        originalName: string;
        mimeType: string;
        size: number;
    };
    csvSchema: {
        columns: [{
            name: { type: String, required: true },
            type: {
                type: String,
                enum: TDatasetColumnType,
                required: true
            },
        }],
    },
    visualizationConfig: TVisualizationConfig;
    rowCount: number;
    approvedBy: mongoose.Types.ObjectId | null;
    approvedAt: Date | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const datasetSchema = new mongoose.Schema<IDataset>({
    title: { type: String, required: true },

    domain: { type: String, enum: Object.values(DATASET_DOMAINS), required: true },
    visualizationType: { type: String, enum: Object.values(DATASET_VISUALIZATION_TYPES), required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: Object.values(DATASET_STATUS), default: DATASET_STATUS.PENDING, required: true },
    rejectionReason: { type: String },
    file: {
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
    },
    csvSchema: {
        columns: [{
            name: { type: String, required: true },
            type: { type: String, enum: Object.values(DATASET_COLUMN_TYPES), required: true },
        }],
    },

    visualizationConfig: {
        latitudeColumn: { type: String },
        longitudeColumn: { type: String },
        valueColumn: { type: String },
        stateColumn: { type: String },
        xAxisColumn: { type: String },
    },

    rowCount: { type: Number, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

datasetSchema.index({ status: 1 });
datasetSchema.index({ uploadedBy: 1 });
datasetSchema.index({ domain: 1, status: 1 });
datasetSchema.index({ publishedAt: 1 });

const DatasetModel = mongoose.model<IDataset>("Dataset", datasetSchema, "datasets");

export default DatasetModel;