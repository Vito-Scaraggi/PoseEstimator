import express from 'express'
import C from "../controllers/inference"
import MWBuilder from '../middlewares/middleware';

const InferenceRouter = express.Router()

const inferenceMW = new MWBuilder().addAuth()
                        .addDatasetOwnership()
                        .addCustom(C.startInference)
                        .buildWithErr();

const statusMW = new MWBuilder().addAuth()
                        .addCustom(C.getStatus)
                        .buildWithErr();

InferenceRouter.get('/model/:model/inference/:dataset', inferenceMW);
InferenceRouter.get('/status/:job_id', statusMW);

export default InferenceRouter;