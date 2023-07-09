import express from 'express'
import C from "../controllers/inference"
import MWBuilder from '../middlewares/middleware';

const InferenceRouter = express.Router()

const inferenceMW = new MWBuilder()
                        .addAuth()
                        .addDatasetOwnership()
                        .addCustom(C.startInference)
                        .build();

const statusMW = new MWBuilder()
                    .addAuth()
                    .addCustom(C.getStatus)
                    .build();

InferenceRouter.get('/model/:modelId/inference/:datasetId', inferenceMW)
                .get('/status/:jobId', statusMW);

export default InferenceRouter;