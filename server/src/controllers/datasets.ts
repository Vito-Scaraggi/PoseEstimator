import Dataset from "../models/dataset";
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from "http-status-codes";
import { z } from 'zod'
import { BboxSyntaxError, DatasetNotFound, ExtensionNotMatched, FileNotFoundError, NameAlreadyExists, NotEnoughCredits } from "../utils/exceptions";
import { where, Op } from "sequelize";
import { successHandler } from "../utils/response";
import fs from 'fs-extra'
import path from 'path';
import decompress from 'decompress';

import User from "../models/user";
import Image from "../models/image";

//validation schema for dataset create request
const createDatasetSchema = z.object({
    name: z.string({ required_error : "name is required"})
            .min(1, {message:"name must be 1 or more characters long"})
            .max(30, {message: "name can't be more than 30 characters long"}),
    tags: z.array(
            z.string())
            .optional(),
    format: z.string()
            .min(1,{message:"format must be 1 or more characters long"})
            .max(4,{message: "format can't be more than 4 characters long"})
            .optional()
});

/* validation schema for update dataset request
    .partial() makes all schema properties optional
*/
const updateDatasetSchema = createDatasetSchema.partial();


//validation schema for insert image request
const insertImageSchema = z.object({
    bbox: z.array(
        z.coerce.number({invalid_type_error:"The values of bbox must be numbers"})
        .int({message:"The values of bbox must be integers"}),
        {invalid_type_error: "bbox must be an array"})
        .optional()
})

//validation schema for insert zip request
const insertZipSchema =  z.array(
            z.object({
                img: z.string({invalid_type_error:"The img field must be a string"}),
                bbox: z.array(
                        z.coerce.number({invalid_type_error:"The values of bbox must be numbers"})
                        .int({message:"The values of bbox must be integers"}),
                        {invalid_type_error: "bbox must be an array"})
            }).optional(),
            {invalid_type_error: "bboxes must be an array"}
        ).optional()

// Controller class for handling dataset routes
class DatasetsController{

    //Single image cost in tokens
    private static imgCost : number = Number(process.env.IMG_COST) || 0.1;
    
    //return dataset with given id
    static async getById(req : Request, res : Response, next: NextFunction): Promise<void>{
        
            await Dataset.findByPk(req.params.datasetId)
            .then((dat)=>{
                successHandler(res, dat);
            })
            .catch( (err) => next(err));   
    }
    
    //return all datasets owned by logged user
    static async getAll(req : Request, res : Response, next: NextFunction){
        
            await Dataset.findAll({
                where : { userID : req.params.jwtUserId}
            })
            .then((datasets) => {
                if(datasets){
                    successHandler(res, datasets);
                }else{
                    throw new DatasetNotFound();
                }
            }).catch((err) => next(err))
    }

    //create new dataset with the provided info
    static async create(req : Request, res : Response, next: NextFunction){
        try{
            //validate dataset info
            const value = createDatasetSchema.parse(req.body);
            
            /*
                search for a dataset owned by the user 
                with the name specified in the info
            */
            const sameNameDat = await Dataset.findOne({
                where : { 
                    [Op.and]: [{ userID : req.params.jwtUserId }, { 'name': value.name }] }
            })

            //If there isn't a dataset with that name, it's created in the database
            if(!sameNameDat){
                const dataset = await Dataset.create({
                    name: value.name,
                    tags: value.tags || [],
                    format: value.format,
                    userID: req.params.jwtUserId
                })
                successHandler(res, dataset, StatusCodes.CREATED);
            }else{
                //if there is already a dataset with that name, throw error
                throw new NameAlreadyExists();
            }
            
        }catch(error){
            return next(error);
        }
    }

    //delete user with given id
    static async delete(req : Request, res : Response, next: NextFunction){
        try{
            const datasetToDelete =  await Dataset.findByPk(req.params.datasetId);
            await datasetToDelete?.destroy().then(
                () => successHandler(res, datasetToDelete)
                );
        }catch(error){
            return next(error);
        }
    }

    // update dataset with given id
    static async updateById(req : Request, res : Response, next: NextFunction){
        try{

            // find the dataset and validate dataset info
            const dat = await Dataset.findByPk(req.params.datasetId)
            const value = updateDatasetSchema.parse(req.body);

           /*
                search for a dataset owned by the user 
                with the name specified in the info
            */
            const sameNameDat = await Dataset.findOne({
                where : { 
                    [Op.and]: [{ userID : req.params.datasetOwner }, { 'name': value.name }] }
            })

             //If there isn't a dataset with that name, it's updated with info
            if(!sameNameDat){
                dat?.update({
                    name: value.name,
                    tags: value.tags || [],
                    format: value.format,
                });

            }else{
                //if there is already a dataset with that name, throw error
                throw new NameAlreadyExists();
            }
            successHandler(res, dat, StatusCodes.CREATED);
        }catch(error){
            return next(error);
        }
    }

    // insert image in specified dataset by id
    static async insertImg(req : Request, res : Response, next: NextFunction){
        try{
            // if there is a file
            if(req.file){

                // validate info of bbox
                const value = insertImageSchema.parse(JSON.parse(req.body["info"]))

                // credits of the user
                const ownedCredits = Number(req.params.credit).valueOf();

                // extension of the file
                const img_ext = path.parse(req.file.path).ext

                // if the extension of the file is the same as the one of the dataset               
                if(img_ext.replace('.','') === req.params.datasetFormat){
                    // if the user has enough credits
                    if (ownedCredits >= DatasetsController.imgCost){
                    
                        let IMAGE;
                        
                        // if no bbox is specified, it will be used the default one
                        if(!value.bbox){
                            IMAGE = await Image.create({
                                datasetID: req.params.datasetId
                            });
                        }else{
                            // if there is a bbox and has all 4 values
                            if(value.bbox.length === 4){
                                // image created in the database with specified bbox
                                IMAGE = await Image.create({
                                    bbox: value.bbox,
                                    datasetID: req.params.datasetId
                                });
                            }else{
                                throw new BboxSyntaxError();
                            }
                        }

                        // autogenerated numerical id of the file
                        let file_id = IMAGE.get('file_id');

                        /*
                            create the name of the file as a 12 characters name as:
                            prefix of zeros + file_id 
                        */
                        const zeroPad = (num: number, places:number) => String(num).padStart(places, '0')
                        file_id = zeroPad(file_id as number,12);

                        // rename the file with the unique name just created
                        const images_dir = path.parse(req.file.path).dir
                        fs.rename(req.file.path, images_dir + '/' + file_id + img_ext)

                        // decrement user's credits
                        const user = await User.findOne({
                            where : {id : req.params.jwtUserId}
                        });    
                        user?.decrement({ credit : DatasetsController.imgCost});
                        await user?.save();

                        // message to return
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

    // insert zip in specified dataset by id
    static async insertZip(req : Request, res : Response, next: NextFunction){
        try{
            //if there is a file
            if(req.file){

                // validate info
                const value = insertZipSchema.parse(JSON.parse(req.body["info"]))

                // user's credits
                const ownedCredits = Number(req.params.credit).valueOf();
                
                // directory where is saved the file, which is the dataset directory
                const datasetDir = path.parse(req.file.path).dir

                // structures to return info of the operation
                const uuidList: string[] = []
                const wrongImages: string[] = []
                let counterWrongImage : number = 0

                // deccompress the zip
                const files = await decompress(req.file.path, datasetDir)

                // if the user has enough credits
                if(ownedCredits >= DatasetsController.imgCost * files.length){
               
                    // for each file on the zip
                    for (const file of files){

                        const img_ext = path.parse(file.path).ext
                        const file_path = './' + datasetDir + '/' + file.path;

                        // check if the ext of the file is the same as the one of the dataset
                        if(img_ext.replace('.','') === req.params.datasetFormat){
                            
                            // search the bbox for the image (if it's specified)
                            const bbox_img = value?.find((elem:any) => elem.img === file.path)?.bbox
                            let img;
                            
                            //if there is a bbox and its correct
                            if(bbox_img && bbox_img.length === 4){

                                //create image in the db with bbox
                                img = await Image.create({
                                    bbox: bbox_img,
                                    datasetID: req.params.datasetId
                                });
                            }else{
                                //create the image in the db with default bbox
                                img = await Image.create({
                                    datasetID: req.params.datasetId
                                });
                            }
             
                            // autogenerated numerical id of the file
                            let file_id = img.get('file_id');

                            /*
                                create the name of the file as a 12 characters name as:
                                prefix of zeros + file_id 
                            */
                            const zeroPad = (num: number, places:number) => String(num).padStart(places, '0')
                            file_id = zeroPad(file_id as number,12);
                            const file_newName = './' + datasetDir + '/' + file_id + img_ext;

                            // rename the file
                            await fs.rename(file_path, file_newName)
    
                            // save the uuid of the image in a list
                            uuidList.push(img.getDataValue('uuid') as string)
                        
                        }else{
                            // removing wrong extension image
                            wrongImages.push(path.parse(file_path).base);
                            await fs.unlink(file_path);
                            counterWrongImage += 1;
                        }
                    };//end for

                     // decrement user's credits (counting only the right extension images)
                    const user = await User.findOne({
                        where : {id : req.params.jwtUserId}
                    }).then((u) =>{
                        const cost : number = DatasetsController.imgCost * (files.length - counterWrongImage)
                        u?.decrement({ credit : cost.toFixed(2)});
                        u?.save();

                        // message to return
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