import express from 'express'
import DatasetsController from "../controllers/datasets"

const DatasetsRouter = express.Router()

DatasetsRouter
            .get("/dataset/all", DatasetsController.getAll)
            .get("/dataset/:id", DatasetsController.getById)
            .post("/dataset", DatasetsController.create)
            .delete("/dataset/:id", DatasetsController.delete)

export default DatasetsRouter;