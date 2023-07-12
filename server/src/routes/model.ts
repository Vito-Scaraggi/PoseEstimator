import express from 'express'

import C from "../controllers/model"
import MWBuilder from '../middlewares/middleware';

// model router instantiation
const ModelRouter = express.Router()

// model routes definition
ModelRouter.get("/model", new MWBuilder()
                            .addCustom(C.getAll)
                            .build() );

export default ModelRouter;