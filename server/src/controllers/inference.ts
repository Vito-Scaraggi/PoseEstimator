import { Request, Response, NextFunction } from 'express'
import { z } from 'zod';

import SingletonProxy from '../utils/proxy';
import { successHandler }  from '../utils/response';
import Model from '../models/model';
import User from '../models/user';
import Image from '../models/image';
import { ModelNotFound, InferenceError } from '../utils/exceptions';


// Controller class for handling inference routes
class InferenceController {

    // amount of credit required for a single inference
    private static infCost : number = Number(process.env.INF_COST) || 5;

    // send a inference request if user has enough credits
    static async startInference(req : Request, res : Response, next : NextFunction){
        
        try{
            
            // validate model id
            const schema = z.coerce.number({ invalid_type_error : "model id must be a number"})
                            .int({ message : "model id must be a integer"});
            schema.parse(req.params.modelId);

            // get selected model from db
            const model = await Model.findByPk(req.params.modelId);
            
            if(model){
                const modelName : string = model.getDataValue("name");
                const ownedCredits = Number(req.params.credit).valueOf();

                let data : { [key:string] : any} = {};
                let billed  : boolean = false;

                // check if user has enough credits
                if (ownedCredits >= InferenceController.infCost){
                    
                    /*  enrich request body with
                        format of imgs to be processed and
                        bounding boxes of imgs
                    */
                    billed = true;
                    data["img_format"] = req.params.datasetFormat;
                    data["bboxes"] = await Image.findAll({
                        where : {datasetID : req.params.datasetId}
                    })  
                    .then( (data) => data.map( (row) => 
                                                { return { image_id : row.getDataValue("file_id"),
                                                            bbox : row.getDataValue("bbox")
                                                }}
                    ));
                }
                
                /* 
                    return UNAUTHORIZED for ABORTED?
                    let retStatus = data["billed"] ? StatusCodes.OK : StatusCodes.UNAUTHORIZED; 
                */

                data["billed"] = billed;

                // setting dataset folder name
                const datasetName = req.params.datasetId
                
                /*  send inference request to proxy
                    if billed = false request will be sent
                    but inference will be aborted by worker
                    and user won't be billed
                */

                const result = await SingletonProxy.getInstance().inference(modelName, datasetName, data)

                if (result.error)
                        throw new InferenceError(result.error);
                else {
                    if (billed){
                        const user = await User.findByPk(req.params.jwtUserId);    
                        user?.decrement({ credit : InferenceController.infCost});
                        await user?.save();
                    }
                    successHandler(res, result); 
                }
            }
            else
                throw new ModelNotFound();
        }
        catch(err){
            next(err);
        }
    }

    // return inference request status
    static async getStatus(req : Request, res : Response, next : NextFunction){
        try{
            await SingletonProxy.getInstance().status(req.params.jobId)
            .then( (data) => successHandler(res, data))
            .catch( ( err) => next(err) );
        }
        catch(err){
            next(err);
        }
    }
}

export default InferenceController;