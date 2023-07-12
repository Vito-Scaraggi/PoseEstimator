import express from 'express'
import C from "../controllers/inference"
import MWBuilder from '../middlewares/middleware';

// inference router instantiation
const InferenceRouter = express.Router();

// simple authorization middleware
const authMW = new MWBuilder().addAuth();

// inference routes definition
InferenceRouter.get('/model/:modelId/inference/:datasetId', authMW.copy()
                                                            .addDatasetOwnership()
                                                            .build(C.startInference))
                .get('/status/:jobId', authMW.copy()
                                            .build(C.getStatus));

export default InferenceRouter;