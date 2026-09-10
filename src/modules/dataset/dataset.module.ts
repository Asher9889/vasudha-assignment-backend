import DatasetController from "./dataset.controller";
import DatasetService from "./dataset.service";

const datasetService = new DatasetService();
const datasetController = new DatasetController(datasetService);

export { datasetController, datasetService };