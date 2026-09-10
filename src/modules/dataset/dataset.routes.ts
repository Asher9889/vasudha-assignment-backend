import express from "express";
import { datasetController } from "./dataset.module";
import upload from "./storage/multer";

const router = express.Router();

router.post("/", upload.single("file"), datasetController.uploadCsv);

export default router;