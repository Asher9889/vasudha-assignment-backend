import csvParser from "csv-parser";
import fs from "node:fs";
import { ApiError } from "../../utils";
import { StatusCodes } from "http-status-codes";
import { ParsedColumn, ParsedCSV, TDatasetColumnType, WrongRow } from "./dataset.types";


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
                results: validRows,
                wrongData: wrongRows,
                columns,
                rowCount: rows.length,
                validCount: validRows.length,
                wrongCount: wrongRows.length,
            };
        } catch (error: unknown) {
            if (error instanceof ApiError) throw error;

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Failed to upload dataset: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

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
}

export default DatasetService;
