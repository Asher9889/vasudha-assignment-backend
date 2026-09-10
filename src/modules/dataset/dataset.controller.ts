import { Request, Response, NextFunction } from "express";
import DatasetService from "./dataset.service";
import { ApiError, ApiResponse } from "../../utils";
import { StatusCodes } from "http-status-codes";
import { TCreateDatasetSchemaDTO, TGetAllDatasetsQueryDTO, TUpdateDatasetStatusDTO } from "./dataset.types";

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

    createDataset = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataset = req.validatedBody as TCreateDatasetSchemaDTO;
            const createdDataset = await this.datasetService.createDataset(dataset);
            return ApiResponse.success(res, StatusCodes.CREATED, "Dataset created successfully", createdDataset);
        } catch (error) {
            return next(error); 
        }
    }

    getAllDatasets = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.validatedQuery as TGetAllDatasetsQueryDTO;
            const user = req.validatedUser;
            const result = await this.datasetService.getAllDatasets(query, user.role, user._id.toString());
            return ApiResponse.success(res, StatusCodes.OK, "Datasets fetched successfully", result);
        } catch (error) {
            return next(error);
        }
    }

    getDatasetById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.validatedParams as { id: string };
            const dataset = await this.datasetService.getDatasetById(id);
            return ApiResponse.success(res, StatusCodes.OK, "Dataset fetched successfully", dataset);
        } catch (error) {
            return next(error);
        }
    }

    getPublicDatasets = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.validatedQuery as TGetAllDatasetsQueryDTO;
            const result = await this.datasetService.getPublicDatasets(query);
            return ApiResponse.success(res, StatusCodes.OK, "Public datasets fetched successfully", result);
        } catch (error) {
            return next(error);
        }
    }

    getPublicDatasetById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.validatedParams as { id: string };
            const dataset = await this.datasetService.getPublicDatasetById(id);
            return ApiResponse.success(res, StatusCodes.OK, "Public dataset fetched successfully", dataset);
        } catch (error) {
            return next(error);
        }
    }

    updateDatasetStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.validatedParams as { id: string };
            const body = req.validatedBody as TUpdateDatasetStatusDTO;
            const approvedBy = req.validatedUser?._id.toString();
            const dataset = await this.datasetService.updateDatasetStatus(id, body, approvedBy);
            return ApiResponse.success(res, StatusCodes.OK, "Dataset status updated successfully", dataset);
        } catch (error) {
            return next(error);
        }
    }
}

export default DatasetController;