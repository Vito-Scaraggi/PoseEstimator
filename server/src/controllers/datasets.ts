import Dataset from "../models/dataset";
import { Request, Response, NextFunction, response, request } from 'express'
import { StatusCodes } from "http-status-codes";
import { z } from 'zod'
import { DatasetNotFound, DatasetNotValid, FileNotFoundError, InvalidFile } from "../utils/exceptions";
import { where, Op } from "sequelize";
import multer from 'multer';



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

const upload = multer({dest: '../../uploads/'})

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
                where : { userID : req.params.userID}
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
                    userID: req.params.userID
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

    static async updateById(req : Request, res : Response, next: NextFunction){
        try{
            const dat = await Dataset.findOne({
                where : { 
                    [Op.and]: [{ userID : req.params.userID }, { 'id': req.params.id }] }
            })

            if(dat){
                const value = updateDatasetSchema.safeParse(req.body);

                if(value.success){
                    const sameNameDat = await Dataset.findOne({
                        where : { 
                            [Op.and]: [{ userID : req.params.userID }, { 'name': value.data.name }] }
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

    static async insertImg(req : Request, res : Response, next: NextFunction){
        try{
            upload.array('image')(request,response, async (err : any) => {

                if(err instanceof multer.MulterError){
                    throw new InvalidFile();
                }else if(err){
                    throw new Error('Something went wrong in the upload of the file');
                }
                console.warn("EEEEEEEEE " + req.file )
                if(req.file){
                    //Scalare i crediti dell'utente
                    return res.status(StatusCodes.CREATED).json(req.file);
                }else{
                    throw new FileNotFoundError();
                }


            })

        }catch(er){
            next(er)
        }
    }

}

export default DatasetsController;