import Dataset from "../models/dataset";
import { Request, Response, NextFunction, response, request } from 'express'
import { StatusCodes } from "http-status-codes";
import { z } from 'zod'
import { BboxSyntaxError, DatasetNotFound, DatasetNotValid, ExtensionNotMatched, FileNotFoundError, InvalidFile, NotEnoughCredits } from "../utils/exceptions";
import { where, Op } from "sequelize";
import { successHandler } from "../utils/response";
import fs from 'fs-extra'
import path from 'path';
import decompress from 'decompress';

import User from "../models/user";
import Image from "../models/image";

const createDatasetSchema = z.object({
    name: z.string().min(1).max(25),
    tags: z.array(z.string()).optional(),
    format: z.string().min(2).max(4).optional()
});

const updateDatasetSchema = z.object({
    name: z.string({required_error: ''})
    .min(1,{message: ''})
    .max(25)
    .optional(),
    tags: z.array(z.string()).optional(),
    format: z.string().min(2).max(4).optional()
});

const insertImageSchema = z.object({
    bbox: z.array(z.coerce.number().int()).optional()
})

const insertZipSchema =  z.array(
            z.object({
                img: z.string(),
                bbox: z.array(z.coerce.number().int(),{invalid_type_error: "Non prende i bbox interni"})
            }).optional(),
            {invalid_type_error: "Non prende i bboxes"}
        ).optional()

const insertZipElemSchema = 
            z.object({
                img: z.string(),
                bbox: z.array(z.coerce.number().int(),{invalid_type_error: "Non prende i bbox interni"})
            }).optional()
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
            const value = createDatasetSchema.parse(req.body);
            
                const DATASET = await Dataset.create({
                    name: value.name,
                    tags: value.tags || [],
                    format: value.format,
                    userID: req.params.jwtUserId
                });
                successHandler(res, DATASET,StatusCodes.CREATED);

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
            const value = updateDatasetSchema.parse(req.body);

          
                const sameNameDat = await Dataset.findOne({
                    where : { 
                        [Op.and]: [{ userID : req.params.jwtUserId }, { 'name': value.name }] }
                })

                if(!sameNameDat){
                    dat?.update({
                        name: value.name,
                        tags: value.tags || [],
                        format: value.format,
                    });

                    successHandler(res, dat, StatusCodes.CREATED);
                }else{
                    throw new DatasetNotValid();
                }
        
        }catch(error){
            return next(error);
        }
    }

    static async insertImg(req : Request, res : Response, next: NextFunction){
        try{

            const body = JSON.parse(req.body["info"])
            const value = insertImageSchema.parse(body)
            const ownedCredits = Number(req.params.credit).valueOf();

            if(req.file){
                const img_ext = path.parse(req.file.path).ext

                 //Check su uniformita estensione immmagine-dataset
                 
                if(img_ext.replace('.','') === req.params.datasetFormat){
                    if (ownedCredits >= DatasetsController.imgCost){
                    
                        let IMAGE;
                        
                        if(!value.bbox){
                            IMAGE = await Image.create({
                                datasetID: req.params.datasetId
                            });
                        }else{
                            if(value.bbox.length === 4){
                                IMAGE = await Image.create({
                                    bbox: value.bbox,
                                    datasetID: req.params.datasetId
                                });
                            }else{
                                throw new BboxSyntaxError();
                            }
                        }

                        let file_id = IMAGE.get('file_id');
                        const zeroPad = (num: number, places:number) => String(num).padStart(places, '0')
                        file_id = zeroPad(file_id as number,12);

                        const images_dir = path.parse(req.file.path).dir
                        fs.rename(req.file.path, images_dir + '/' + file_id + img_ext)

                        //Scalare i crediti dell'utente
                        const user = await User.findOne({
                            where : {id : req.params.jwtUserId}
                        });    
                        user?.decrement({ credit : DatasetsController.imgCost});
                        await user?.save();

                        const jsonMessage = {
                            "image_uuid": IMAGE.get('uuid')
                        }
                        successHandler(res, jsonMessage, StatusCodes.CREATED);
                    }else{
                        throw new NotEnoughCredits();
                    }
                }else{
                    throw new ExtensionNotMatched();
                }
            }else{
                throw new FileNotFoundError();
            }
        }catch(er){
            next(er)
        }
    }

    static async insertZip(req : Request, res : Response, next: NextFunction){
        try{
            if(req.file){

                const body = JSON.parse(req.body["info"])
                const value = insertZipSchema.parse(body)
                const ownedCredits = Number(req.params.credit).valueOf();
                
                const uuidList: string[] = []
                const wrongImages: string[] = []
                let counterWrongImage : number = 0

                const datasetDir = path.parse(req.file.path).dir
                
                const files = await decompress(req.file.path, datasetDir)

                if(ownedCredits >= DatasetsController.imgCost * files.length){
               
                    for (const file of files){
                        const img_ext = path.parse(file.path).ext
                        const file_path = './' + datasetDir + '/' + file.path;
                        //check if the ext of the file is the same as the dataset
                        if(img_ext.replace('.','') === req.params.datasetFormat){
                            
                            const bbox_img = value?.find((elem:any) => elem.img === file.path)?.bbox
                            let img;
                            
                            if(bbox_img && bbox_img.length === 4){
                                img = await Image.create({
                                    bbox: bbox_img,
                                    datasetID: req.params.datasetId
                                });
                            }else{
                                img = await Image.create({
                                    datasetID: req.params.datasetId
                                });
                            }
             
                            let file_id = img.get('file_id');
                            const zeroPad = (num: number, places:number) => String(num).padStart(places, '0')
                            file_id = zeroPad(file_id as number,12);
    
                            const file_newName = './' + datasetDir + '/' + file_id + img_ext;
                            await fs.rename(file_path, file_newName)
    
                            uuidList.push(img.getDataValue('uuid') as string)
                        
                        }else{
                            //Removing wrong image
                            wrongImages.push(path.parse(file_path).base);
                            await fs.unlink(file_path);
                            counterWrongImage += 1;
                        }
                    };//end for

                     //Scalare i crediti dell'utente
                    const user = await User.findOne({
                        where : {id : req.params.jwtUserId}
                    }).then((u) =>{
                        const cost : number = DatasetsController.imgCost * (files.length - counterWrongImage)
                        u?.decrement({ credit : cost.toFixed(2)});
                        u?.save();
                        const jsonMessage = {
                            "images_uuid": uuidList,
                            "number_invalid_images": counterWrongImage,
                            "invalid_images":wrongImages
                        }
                        successHandler(res, jsonMessage , StatusCodes.CREATED);
                    })  
                    await fs.unlink(req.file.path);
        
                }else{
                    throw new NotEnoughCredits();
                }
                    
            }else{
                throw new FileNotFoundError();
            }
        }catch(error){
            next(error)
        }
    }
}

export default DatasetsController;