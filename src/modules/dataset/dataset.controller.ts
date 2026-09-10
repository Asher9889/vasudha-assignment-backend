import { Request, Response, NextFunction } from "express";
import DatasetService from "./dataset.service";
import { ApiError, ApiResponse } from "../../utils";
import { StatusCodes } from "http-status-codes";

class DatasetController {
    private readonly datasetService: DatasetService;

    constructor(datasetService: DatasetService) {
        this.datasetService = datasetService;
    }

    uploadCsv = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const file = req.file;
            if (!file) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "CSV file is not uploaded");
            }
            console.log("File received:", file.originalname, "Size:", file.size); // Debugging line
            const dataset = await this.datasetService.uploadCsv(file);
            return ApiResponse.success(res, StatusCodes.OK, "Dataset uploaded successfully", dataset);
        } catch (error) {
            return next(error);
        }
    }
}

export default DatasetController;