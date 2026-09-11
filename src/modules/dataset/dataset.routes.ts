import express from "express";
import { datasetController } from "./dataset.module";
import upload from "./storage/multer";
import { createDatasetSchema, getAllDatasetsQuerySchema, datasetIdParamSchema, updateDatasetSchema, updateDatasetStatusSchema } from "./dataset.schema";
import { schemaValidate, queryValidate, paramsValidate, authenticate, authorize } from "../../middlewares";
import { USER_ROLE } from "../user";

const router = express.Router();

router.get("/", authenticate, queryValidate(getAllDatasetsQuerySchema), datasetController.getAllDatasets);
router.get("/public/:id", paramsValidate(datasetIdParamSchema), datasetController.getPublicDatasetById);
router.get("/public", queryValidate(getAllDatasetsQuerySchema), datasetController.getPublicDatasets);
router.get("/:id", paramsValidate(datasetIdParamSchema), datasetController.getDatasetById);
router.post("/upload", upload.single("file"), datasetController.uploadCsv);
router.post("/", schemaValidate(createDatasetSchema), datasetController.createDataset);
router.patch("/:id", authenticate, authorize(USER_ROLE.SUPER_ADMIN), paramsValidate(datasetIdParamSchema), schemaValidate(updateDatasetSchema), datasetController.updateDataset);
router.patch("/:id/status", authenticate, authorize(USER_ROLE.SUPER_ADMIN), paramsValidate(datasetIdParamSchema), schemaValidate(updateDatasetStatusSchema), datasetController.updateDatasetStatus);

export default router;