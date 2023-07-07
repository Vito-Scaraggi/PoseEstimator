import Dataset from "../models/dataset";
import { Request, Response, NextFunction, response } from 'express'
import { StatusCodes } from "http-status-codes";
import { z } from 'zod'

const createDatasetSchema = z.object({
    name: z.string().min(1).max(25),
    tags: z.array(z.string()).optional(),
    format: z.string().min(2).max(4).optional()
});

class DatasetsController{

    
    static async getById(req : Request, res : Response): Promise<void>{

        await Dataset.findByPk(req.params.id)
        .then( (data : any) => res.send(data) )
        .catch( ( err : any) => res.send(err) );
    }
    

    static async getAll(req : Request, res : Response){
        await Dataset.findAll()
        .then( (data : any) => res.send(data) )
        .catch( ( err : any) => res.send(err) );
    }


    static async create(req : Request, res : Response){
       
    try{
        const value = createDatasetSchema.safeParse(req.body);
        
        if(!value.success){
            return res.status(StatusCodes.BAD_REQUEST).json(value.error);
        }else{
            const DATASET = await Dataset.create({
                name: value.data.name,
                tags: value.data.tags || [],
                format: value.data.format,
                userID: 1 //VA MODIFICATO
             });
    
             return res.status(StatusCodes.CREATED).json(DATASET);
        }
    }catch(error){
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
    }
    }

    static async delete(req : Request, res : Response){

        try{
    
            //const DatasetToDelete = await Dataset.findByPk(req.params.id)
            //DatasetToDelete?.destroy()

            /*
            await Dataset.destroy({
                where: {
                    id : <unknown>req.params.id as number
                }
            }).then( (data : any) => {
                res.send(data);
            }
            );
            */
        }catch(error){
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
        }
    }
}

export default DatasetsController;