import Model from "../models/model"
import { Request, Response, NextFunction } from 'express'
import { successHandler } from "../utils/response";

// Controller class for handling model routes
class ModelsController{

    // return all available models
    static async getAll(req : Request, res : Response, next : NextFunction) : Promise <void>{
        await Model.findAll().then( (data) => {
            successHandler(res, data );
         })
         .catch( (err) => next(err));
    }
    
}

export default ModelsController;