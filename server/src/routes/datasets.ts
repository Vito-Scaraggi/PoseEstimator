import express from 'express'
import DatasetsController from "../controllers/datasets"
import MWBuilder from '../middlewares/middleware';

// dataset router instantiation
const DatasetsRouter = express.Router()

// simple authorization middleware
const authMW = new MWBuilder().addAuth();

// dataset routes definition
DatasetsRouter
            .get("/dataset/all",  authMW.copy().build(DatasetsController.getAll) )
            .get("/dataset/:datasetId",authMW.copy().addDatasetOwnership().build(DatasetsController.getById))
            .post("/dataset", authMW.copy().build(DatasetsController.create))
            .delete("/dataset/:datasetId", authMW.copy().addDatasetOwnership().build(DatasetsController.delete))
            .put("/dataset/:datasetId", authMW.copy().addDatasetOwnership().build(DatasetsController.updateById))
            .post("/dataset/:datasetId/img", authMW.copy().addDatasetOwnership().addUploader().build(DatasetsController.insertImg))
            .post("/dataset/:datasetId/zip", authMW.copy().addDatasetOwnership().addUploaderZip().build( DatasetsController.insertZip))


export default DatasetsRouter;