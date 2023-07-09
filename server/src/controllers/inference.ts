import { Request, Response, NextFunction } from 'express'
import { z } from 'zod';

import SingletonProxy from '../utils/proxy';
import { successHandler }  from '../utils/response';
import Model from '../models/model';
import User from '../models/user';
import Image from '../models/image';
import Dataset from '../models/dataset';
import { ModelNotFound } from '../utils/exceptions';

class InferenceController {

    private static infCost : number = Number(process.env.INF_COST) || 5;

    static async startInference(req : Request, res : Response, next : NextFunction){
        
        try{
            
            const schema = z.coerce.number().int();
            schema.parse(req.params.modelId);

            const model = await Model.findOne( { 
                                where : { id : Number(req.params.modelId) }
                            });

            if(model){
                const modelName : string = model.getDataValue("name");
                const ownedCredits = Number(req.params.credit).valueOf();

                let data : { [key:string] : any} = {};
                data["billed"] = false;

                if (ownedCredits >= InferenceController.infCost){
                    
                    const user = await User.findOne({
                        where : {id : req.params.jwtUserId}
                    });    
                    user?.decrement({ credit : InferenceController.infCost});
                    await user?.save();

                    data["billed"] = true;
                    data["img_format"] = await Dataset.findOne({
                        where : {id : req.params.datasetId}
                    })
                    .then( (data) => data?.getDataValue("img_format"));

                    data["bboxes"] = await Image.findAll({
                        where : {datasetID : req.params.datasetId}
                    })  
                    .then( (data) => data.map( (row) => 
                                                { return { image_id : row.getDataValue("file_id"),
                                                            bbox : row.getDataValue("bbox")
                                                }}
                    ));
                }
                
                await SingletonProxy.getInstance().inference(modelName, req.params.datasetName, data)
                .then( (data) => successHandler(res, data) )
                .catch( ( err) => next(err) );
            }
            else
                throw new ModelNotFound();
        }
        catch(err){
            next(err);
        }
    }

    static async getStatus(req : Request, res : Response, next : NextFunction){
        try{
            await SingletonProxy.getInstance().status(req.params.jobId)
            .then( (data) => successHandler(res, data) )
            .catch( ( err) => next(err) );
        }
        catch(err){
            next(err);
        }
    }
}

export default InferenceController;