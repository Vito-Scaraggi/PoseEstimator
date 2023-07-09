import express from 'express'
import DatasetsController from "../controllers/datasets"
import MWBuilder from '../middlewares/middleware';

const DatasetsRouter = express.Router()

DatasetsRouter
            .get("/dataset/all",  new MWBuilder().addAuth().addCustom( DatasetsController.getAll).build() )
            .get("/dataset/:datasetId",new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.getById).build())
            .post("/dataset", new MWBuilder().addAuth().addCustom( DatasetsController.create).build())
            .delete("/dataset/:datasetId", new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.delete).build())
            .put("/dataset/:datasetId", new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.updateById).build())
            .post("/dataset/:datasetId/img", new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.insertImg).build())

export default DatasetsRouter;