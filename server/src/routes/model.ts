import express from 'express'

import C from "../controllers/model"
import MWBuilder from '../middlewares/middleware';

const ModelRouter = express.Router()

//add other routes here
ModelRouter.get("/model", new MWBuilder()
                            .addCustom(C.getAll)
                            .build() );

export default ModelRouter;