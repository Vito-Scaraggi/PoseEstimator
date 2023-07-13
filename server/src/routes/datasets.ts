import express from 'express'
import DatasetsController from "../controllers/datasets"
import MWBuilder from '../middlewares/middleware';

// dataset router instantiation
const DatasetsRouter = express.Router()

// simple authorization middleware
const authMW = new MWBuilder().addAuth();

// authorization + dataOwnership middleware
const dataOwnerMW = authMW.copy().addDatasetOwnership();

// dataset routes definition
DatasetsRouter
            .get("/dataset/all",  authMW.copy().build(DatasetsController.getAll) )
            .get("/dataset/:datasetId",dataOwnerMW.copy().build(DatasetsController.getById))
            .post("/dataset", authMW.copy().build(DatasetsController.create))
            .delete("/dataset/:datasetId", dataOwnerMW.copy().build(DatasetsController.delete))
            .put("/dataset/:datasetId", dataOwnerMW.copy().build(DatasetsController.updateById))
            .post("/dataset/:datasetId/img", dataOwnerMW.copy().addUploader().build(DatasetsController.insertImg))
            .post("/dataset/:datasetId/zip", dataOwnerMW.copy().addUploaderZip().build( DatasetsController.insertZip))


export default DatasetsRouter;