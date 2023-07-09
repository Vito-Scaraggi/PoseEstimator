import Dataset from "../models/dataset";
import { Request, Response, NextFunction, response } from 'express'
import { StatusCodes } from "http-status-codes";
import { z } from 'zod'
import { DatasetNotFound, DatasetNotValid } from "../utils/exceptions";
import { where, Op } from "sequelize";

const createDatasetSchema = z.object({
    name: z.string().min(1).max(25),
    tags: z.array(z.string()).optional(),
    format: z.string().min(2).max(4).optional()
});

const updateDatasetSchema = z.object({
    name: z.string().min(1).max(25).optional(),
    tags: z.array(z.string()).optional(),
    format: z.string().min(2).max(4).optional()
});

class DatasetsController{

    
    static async getById(req : Request, res : Response, next: NextFunction): Promise<void>{
        try{
            const dat = await Dataset.findByPk(req.params.id)
            if(dat){
                res.send(dat);
            }else{
                throw new DatasetNotFound();
            }
        }catch(error){
            next(error)
        }
    }
    

    static async getAll(req : Request, res : Response, next: NextFunction){
        try{
            const datasets =  await Dataset.findAll({
                where : { userID : 1}
            })

            if(datasets){
                res.send(datasets);
            }else{
                throw new DatasetNotFound();
            }
        }catch(error){
            next(error)
        }
    }


    static async create(req : Request, res : Response, next: NextFunction){
        try{
            const value = createDatasetSchema.safeParse(req.body);
            
            if(value.success){
                const DATASET = await Dataset.create({
                    name: value.data.name,
                    tags: value.data.tags || [],
                    format: value.data.format,
                    userID: 1 //VA MODIFICATO
                });
        
                return res.status(StatusCodes.CREATED).json(DATASET);
            }else{
                throw new DatasetNotValid();
            }
        }catch(error){
            return next(error);
        }
    }

    static async delete(req : Request, res : Response, next: NextFunction){
        try{
            const datasetToDelete =  await Dataset.findByPk(req.params.id);

            if(datasetToDelete){
                datasetToDelete.destroy()
                res.status(StatusCodes.OK).json(datasetToDelete);
            }else{
                throw new DatasetNotFound();
            }
        }catch(error){
            return next(error);
        }
    }

    static async update(req : Request, res : Response, next: NextFunction){
        try{
            const dat = await Dataset.findOne({
                where : { 
                    [Op.and]: [{ userID : 1 }, { 'id': req.params.id }] }
            })

            if(dat){
                const value = updateDatasetSchema.safeParse(req.body);

                if(value.success){
                    const sameNameDat = await Dataset.findOne({
                        where : { 
                            [Op.and]: [{ userID : 1 }, { 'name': value.data.name }] }
                    })

                    if(!sameNameDat){
                        dat.update({
                            name: value.data.name,
                            tags: value.data.tags || [],
                            format: value.data.format,
                        });
                        
                        return res.status(StatusCodes.CREATED).json(dat);
                    }else{
                        throw new DatasetNotValid();
                    }
                   
                } else {
                    throw new DatasetNotValid();     
                }
            }else{
                throw new DatasetNotFound();
            }  
        
        }catch(error){
            return next(error);
        }
    }
}

export default DatasetsController;