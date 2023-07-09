import express from 'express'
import DatasetsController from "../controllers/datasets"
import MWBuilder from '../middlewares/middleware';

const DatasetsRouter = express.Router()

DatasetsRouter
            .get("/dataset/all",  new MWBuilder().addAuth().addCustom( DatasetsController.getAll).buildWithErr() )
            .get("/dataset/:id",new MWBuilder().addAuth().addCustom( DatasetsController.getById).buildWithErr())
            .post("/dataset", new MWBuilder().addAuth().addCustom( DatasetsController.create).buildWithErr())
            .delete("/dataset/:id", new MWBuilder().addAuth().addCustom( DatasetsController.delete).buildWithErr())
            .put("/dataset/:id", new MWBuilder().addAuth().addCustom( DatasetsController.updateById).buildWithErr())
            .post("/dataset/:id/img", new MWBuilder().addAuth().addCustom( DatasetsController.insertImg).buildWithErr())

export default DatasetsRouter;