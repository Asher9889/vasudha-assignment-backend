import csvParser from "csv-parser";
import fs from "node:fs";
import mongoose from "mongoose";
import { ApiError } from "../../utils";
import { StatusCodes } from "http-status-codes";
import { ParsedColumn, ParsedCSV, TCreateDatasetSchemaDTO, TDatasetColumnType, TGetAllDatasetsQueryDTO, TUpdateDatasetStatusDTO, WrongRow } from "./dataset.types";
import DatasetModel from "./dataset.model";
import path from "node:path";
import DatasetRowModel from "./dataset-row.model";
import { DATASET_STATUS } from "./dataset.constants";
import { USER_ROLE } from "../user";


class DatasetService {

    uploadCsv = async (file: Express.Multer.File): Promise<ParsedCSV> => {
        try {
            const { headers, rows } = await this.parseCsv(file.path); 

            this.validateHeaders(headers);

            if (rows.length === 0) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "CSV file has no data rows");
            }

            const columns: ParsedColumn[] = this.inferColumnTypesFromFirstRow(headers, rows[0]!);

            const { validRows, wrongRows } = this.validateRows(headers, columns, rows);

            return {
                fileKey: file.fieldname,
                results: validRows,
                wrongData: wrongRows,
                columns,
                rowCount: rows.length,
                validCount: validRows.length,
                wrongCount: wrongRows.length,
            };
        } catch (error: unknown) {
            if (error instanceof ApiError) throw error;

            throw new ApiError(StatusCodes.BAD_REQUEST, `Failed to upload dataset: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    getAllDatasets = async (query: TGetAllDatasetsQueryDTO, role: string, userId: string) => {
        try {
            const { page, limit, domain, status, search, sortBy, sortOrder } = query;
            const filter: Record<string, unknown> = {};

            if (role === USER_ROLE.ADMIN) {
                filter.uploadedBy = new mongoose.Types.ObjectId(userId);
            }

            if (domain) filter.domain = domain;
            if (status) filter.status = status;
            if (search) filter.title = { $regex: search, $options: "i" };

            const skip = (page - 1) * limit;
            const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

            const [datasets, total] = await Promise.all([
                DatasetModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                DatasetModel.countDocuments(filter),
            ]);

            return {
                datasets: datasets.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: unknown) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch datasets: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    getDatasetById = async (id: string) => {
        try {
            const dataset = await DatasetModel.findById(id).lean();
            if (!dataset) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Dataset not found");
            }

            const rows = await DatasetRowModel.find({ datasetId: dataset._id }).sort({ rowIndex: 1 }).lean();
            const { _id, ...rest } = dataset;
            return {
                id: _id.toString(), 
                ...rest,
                rows: rows.map((row) => ({ rowIndex: row.rowIndex, data: row.data })),
            };
        } catch (error: unknown) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch dataset: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    updateDatasetStatus = async (id: string, body: TUpdateDatasetStatusDTO, approvedBy: string) => {
        try {
            const { status, rejectionReason } = body;

            const dataset = await DatasetModel.findById(id).lean();
            if (!dataset) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Dataset not found");
            }

            const update: Record<string, unknown> = { status };
            if (status === DATASET_STATUS.APPROVED) {
                update.approvedBy = new mongoose.Types.ObjectId(approvedBy);
                update.approvedAt = new Date();
                update.publishedAt = new Date();
                update.$unset = { rejectionReason: 1 };
            } else {
                update.rejectionReason = rejectionReason;
            }

            const updatedDataset = await DatasetModel.findByIdAndUpdate(id, update, { new: true }).lean();

            const { _id, ...rest } = updatedDataset!;
            return { id: _id.toString(), ...rest };
        } catch (error: unknown) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update dataset status: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    createDataset = async (dataset: TCreateDatasetSchemaDTO) => {
        try {
            const { fileKey, ...datasetData } = dataset;

            const isAlreadyExists = await DatasetModel.findOne({ title: datasetData.title });
            if (isAlreadyExists) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Dataset with this title already exists");
            }

            const filePath = path.join(process.cwd(), "uploads", fileKey);
            const { headers, rows } = await this.parseCsv(filePath);

            this.validateHeaders(headers);

            if (rows.length === 0) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "CSV file has no data rows");
            }

            const columns: ParsedColumn[] = this.inferColumnTypesFromFirstRow(headers, rows[0]!);
            const { validRows, wrongRows } = this.validateRows(headers, columns, rows);

            const datasetObj = new DatasetModel({
                ...datasetData,
                uploadedBy: new mongoose.Types.ObjectId(datasetData.uploadedBy),
                approvedBy: datasetData.approvedBy ? new mongoose.Types.ObjectId(datasetData.approvedBy) : null,
            });
            const savedDataset = await datasetObj.save();

            if (validRows.length > 0) {
                const rowDocs = validRows.map((row, index) => ({
                    datasetId: savedDataset._id,
                    rowIndex: index,
                    data: this.convertRowTypes(row, columns),
                }));
                await DatasetRowModel.insertMany(rowDocs);
            }

            const { _id, ...rest } = savedDataset.toObject();
            return { id: _id.toString(), ...rest, wrongRows };
        } catch (error: unknown) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(StatusCodes.BAD_REQUEST, `Failed to create dataset: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

 
    private parseCsv = (filePath: string): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> => {
        return new Promise((resolve, reject) => {
            const headers: string[] = [];
            const rows: Record<string, unknown>[] = [];
            let settled = false;

            const settle = (fn: () => void) => {
                if (!settled) { settled = true; fn(); }
            };

            const readStream = fs.createReadStream(filePath);

            readStream.on("error", (error) => {
                settle(() => reject(new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Unable to read CSV file: ${error.message}`
                )));
            });

            readStream
                .pipe(csvParser({
                    mapHeaders: ({ header }) => header.trim(),
                }))
                .on("headers", (parsedHeaders: Array<string | null>) => {
                    headers.push(...parsedHeaders.filter((h): h is string => h !== null));
                })
                .on("data", (row: Record<string, unknown>) => {
                    rows.push(row);
                })
                .on("error", (error) => {
                    settle(() => reject(new ApiError(
                        StatusCodes.BAD_REQUEST,
                        `Invalid CSV: ${error instanceof Error ? error.message : "Parse error"}`
                    )));
                })
                .on("end", () => {
                    settle(() => resolve({ headers, rows }));
                });
        });
    };

    private validateHeaders = (headers: string[]): void => {
        if (headers.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "CSV file has no header row");
        }

        const errors: string[] = [];
        const seen = new Map<string, number>();

        for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            if (h == null) continue;

            if (h === "") {
                errors.push(`Column ${i + 1} has an empty header name`);
                continue;
            }

            const lower = h.toLowerCase();
            if (seen.has(lower)) {
                errors.push(
                    `Duplicate header "${h}" (first at column ${seen.get(lower)! + 1}, again at column ${i + 1})`
                );
            } else {
                seen.set(lower, i);
            }
        }

        if (errors.length > 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "CSV header validation failed", errors);
        }
    };

    private validateRows = (
        headers: string[],
        columns: ParsedColumn[],
        rows: Record<string, unknown>[]
    ): { validRows: Record<string, unknown>[]; wrongRows: WrongRow[] } => {
        const validRows: Record<string, unknown>[] = [];
        const wrongRows: WrongRow[] = [];
        const headerSet = new Set(headers);

        rows.forEach((row, index) => {
            const errors: { field: string; message: string }[] = [];

            const extraKeys = Object.keys(row).filter(
                (k) => /^_\d+$/.test(k) && !headerSet.has(k)
            );
            if (extraKeys.length > 0) {
                errors.push({
                    field: extraKeys.join(", "),
                    message: `Row has ${extraKeys.length} extra field(s) not present in the header`,
                });
            }

            for (const { name, type } of columns) {
                const val = String(row[name] ?? "").trim();
                if (val === "") {
                    errors.push({ field: name, message: `Value for "${name}" cannot be empty` });
                    continue;
                }

                if (type === "NUMBER" && Number.isNaN(Number(val))) {
                    errors.push({ field: name, message: `Value for "${name}" must be a number` });
                }

                if (type === "DATE" && Number.isNaN(Date.parse(val))) {
                    errors.push({ field: name, message: `Value for "${name}" must be a valid date` });
                }
            }

            if (errors.length > 0) {
                wrongRows.push({ rowNumber: index + 2, row, errors });
            } else {
                validRows.push(row);
            }
        });

        return { validRows, wrongRows };
    };

    private inferColumnTypesFromFirstRow = (headers: string[], firstRow: Record<string, unknown>): ParsedColumn[] => {
        return headers.map((name) => ({
            name,
            type: this.inferTypeFromValue(String(firstRow[name] ?? "").trim()),
        }));
    };

    private inferTypeFromValue = (value: string): TDatasetColumnType => {
        if (value === "") return "STRING";
        if (!Number.isNaN(Number(value))) return "NUMBER";
        if (!Number.isNaN(Date.parse(value))) return "DATE";
        return "STRING";
    };

    private convertRowTypes = (row: Record<string, unknown>, columns: ParsedColumn[]): Record<string, unknown> => {
        const converted: Record<string, unknown> = {};
        for (const { name, type } of columns) {
            const val = String(row[name] ?? "").trim();
            if (val === "") {
                converted[name] = null;
                continue;
            }
            if (type === "NUMBER") {
                converted[name] = Number(val);
            } else if (type === "DATE") {
                converted[name] = new Date(val);
            } else {
                converted[name] = val;
            }
        }
        return converted;
    };
}

export default DatasetService;
