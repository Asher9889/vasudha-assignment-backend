import mongoose from "mongoose";

interface IDatasetRow extends mongoose.Document {
    datasetId: mongoose.Types.ObjectId;
    rowIndex: number;
    data: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const datasetRowSchema = new mongoose.Schema<IDatasetRow>(
    {
        datasetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dataset",
            required: true,
        },

        rowIndex: {
            type: Number,
            required: true,
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    { timestamps: true, versionKey: false }
);

datasetRowSchema.index({ datasetId: 1, rowIndex: 1 }, { unique: true });

const DatasetRowModel = mongoose.model<IDatasetRow>("DatasetRow", datasetRowSchema,"dataset_rows");

export default DatasetRowModel;