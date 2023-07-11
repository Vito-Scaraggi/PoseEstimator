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

const insertZipSchema = z.object({
        bboxes: z.array(
            z.object({
                img: z.string(),
                bbox: z.array(z.coerce.number().int())
            }).optional()
        ).optional()
    
})
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

            const value = insertImageSchema.parse(req.body)
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

                        successHandler(res, IMAGE.get('uuid'), StatusCodes.CREATED);
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
            console.log("body: " + req.body['info'])
            const value = insertZipSchema.parse(req.body)
            const ownedCredits = Number(req.params.credit).valueOf();
            let uuidList: string[] = []
            let counterWrongImage: number = 0

            if(req.file){
                
                decompress(req.file.path, path.parse(req.file.path).dir)
                .then((files) => {
                    console.log(files.length);
                    if(ownedCredits >= DatasetsController.imgCost * files.length){

                        //per ogni immagine nello zip
                        files.forEach(function(file){
                            const img_ext = path.parse(file.path).ext
                            //check se l'estensione dei file corrisponde a quella del dataset
                            if(img_ext.replace('.','') === req.params.datasetFormat){

                                
                                const bbox_img = value.bboxes?.find(
                                    element => element?.img === path.parse(file.path).base
                                    )?.bbox
                                
                                let img;
                                if(!bbox_img){
                                    img = Image.create({
                                        datasetID: req.params.datasetId
                                    });
                                }

                                if(bbox_img && bbox_img.length === 4){
                                    img = Image.create({
                                        bbox: bbox_img,
                                        datasetID: req.params.datasetId
                                    });
                                }else{
                                    counterWrongImage += 1;
                                }
                                
                                if(img){
                                    img.then(
                                        (image) => {
    
                                            let file_id = image.get('file_id');
                                            const zeroPad = (num: number, places:number) => String(num).padStart(places, '0')
                                            file_id = zeroPad(file_id as number,12);
                    
                                            const images_dir = path.parse(file.path).dir
                                            fs.rename(file.path, images_dir + '/' + file_id + img_ext)
                    
                                            //Scalare i crediti dell'utente
                                            const user = User.findOne({
                                                where : {id : req.params.jwtUserId}
                                            }).then((u) =>{
                                                u?.decrement({ credit : DatasetsController.imgCost * files.length});
                                                u?.save();
                                            })    
                                            uuidList.push(image.get('uuid') as string)
                                        }
                                    ).catch((err) => {
                                        
                                    });
                                }
                                
                            }else{
                                //bisogna rimuovere l'immagine
                               counterWrongImage += 1;
                            }
                        });//end forEach

                        //eliminare lo zip
                        
                        successHandler(res.append('Warning', counterWrongImage + " images not uploaded"), uuidList , StatusCodes.CREATED);
                    }else{
                        throw new NotEnoughCredits();
                    }
                    
                })
                .catch((err) => {
                    next(err)
                });
            }


        }catch(error){
            next(error)
        }
    }

}

export default DatasetsController;