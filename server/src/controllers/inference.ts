import { Request, Response, NextFunction } from 'express'

import SingletonProxy from '../utils/proxy';

class InferenceController {

    static async startInference(req : Request, res : Response, next : NextFunction){
        let model : string = req.params.model
        let dataset : string = req.params.dataset
        //hard coded
        let data =  {
            bboxes : [ {
                            image_id : 12474,
                            bbox : [220, 65, 200, 350]
                        }
                    ],
            billed : true
        }
        
        await SingletonProxy.getInstance().inference(model, dataset, data)
        .then( (data) => res.send(data) )
        .catch( ( err) => next(err) );
    }

    static async getStatus(req : Request, res : Response, next : NextFunction){

        await SingletonProxy.getInstance().status(req.params.job_id)
        .then( (data) => res.send(data))
        .catch( ( err) => next(err) );
    }
}

export default InferenceController;