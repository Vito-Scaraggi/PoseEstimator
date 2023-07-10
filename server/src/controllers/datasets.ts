import Dataset from "../models/dataset";
import { Request, Response, NextFunction, response, request } from 'express'
import { StatusCodes } from "http-status-codes";
import { z } from 'zod'
import { DatasetNotFound, DatasetNotValid, FileNotFoundError, InvalidFile } from "../utils/exceptions";
import { where, Op } from "sequelize";
import multer from 'multer';
import { successHandler } from "../utils/response";
import fs from 'fs-extra'

import User from "../models/user";

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

//const upload = multer({dest: './uploads/'})

class DatasetsController{

    private static imgCost : number = Number(process.env.IMG_COST) || 0.1;
    
    static async getById(req : Request, res : Response, next: NextFunction): Promise<void>{
        try{
            const dat = await Dataset.findByPk(req.params.datasetId)

            successHandler(res, dat);

        }catch(error){
            next(error)
        }
    }
    

    static async getAll(req : Request, res : Response, next: NextFunction){
        try{
            const datasets =  await Dataset.findAll({
                where : { userID : req.params.jwtUserId}
            })

            if(datasets){
                successHandler(res, datasets);
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
                    userID: req.params.jwtUserId
                });
                successHandler(res, DATASET,StatusCodes.CREATED);
            }else{
                throw new DatasetNotValid();
            }
        }catch(error){
            return next(error);
        }
    }

    static async delete(req : Request, res : Response, next: NextFunction){
        try{
            const datasetToDelete =  await Dataset.findByPk(req.params.jwtUserId);

            datasetToDelete?.destroy()
            successHandler(res, datasetToDelete);
            
        }catch(error){
            return next(error);
        }
    }

    static async updateById(req : Request, res : Response, next: NextFunction){
        try{

            const dat = await Dataset.findByPk(req.params.datasetId)
            const value = updateDatasetSchema.safeParse(req.body);

            if(value.success){
                const sameNameDat = await Dataset.findOne({
                    where : { 
                        [Op.and]: [{ userID : req.params.jwtUserId }, { 'name': value.data.name }] }
                })

                if(!sameNameDat){
                    dat?.update({
                        name: value.data.name,
                        tags: value.data.tags || [],
                        format: value.data.format,
                    });

                    successHandler(res, dat, StatusCodes.CREATED);
                }else{
                    throw new DatasetNotValid();
                }
            } else {
                throw new DatasetNotValid();     
            }
        
        }catch(error){
            return next(error);
        }
    }

    static async insertImg(req : Request, res : Response, next: NextFunction){
        try{

            const ownedCredits = Number(req.params.credit).valueOf();

            /*upload.array('image')(request, response, async (err : any) => {

                if(err instanceof multer.MulterError){
                    throw new InvalidFile();
                }else if(err){
                    throw new Error('Something went wrong in the upload of the file');
                }
             */
                console.warn("User credits = " + ownedCredits )
                
                console.warn("Filename: " + req.params.fileName)

                if(req.file){
                    /*Scalare i crediti dell'utente
                    if (ownedCredits >= DatasetsController.imgCost){
                    
                        const user = await User.findOne({
                            where : {id : req.params.jwtUserId}
                        });    
                        user?.decrement({ credit : DatasetsController.imgCost});
                        await user?.save();
                    }
                    */

                    successHandler(res, req.file, StatusCodes.CREATED);
                }else{
                    throw new FileNotFoundError();
                }
            
            // controllare uniformita estensione immmagine-dataset
        }catch(er){
            next(er)
        }
    }

}

export default DatasetsController;