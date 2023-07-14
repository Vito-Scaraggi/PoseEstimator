import {Request, Response, NextFunction} from 'express';
import jwt, { JsonWebTokenError }  from 'jsonwebtoken';
import { z } from 'zod';
import multer from 'multer';
import path  from "path";
import fs from 'fs-extra';
import { randomBytes } from 'crypto';

import ResponseFactory from '../utils/response';
import { MissingToken, MismatchedUser, RestrictedToAdmin, MismatchedDatasetOwner,
        UserNotFound, DatasetNotFound, FileFormatError} from '../utils/exceptions';
import User from '../models/user';
import Dataset from '../models/dataset';

//get the extension in regex
let getRegexFormats = function(formatMode: number){
   switch(formatMode){
        case 0:
            return /jpeg|jpg|png/;
        case 1: 
            return /zip/;
        default:
            return /jpeg|jpg|png/;
   }
}

//Extension and mimetype checker for multer
const checkFileType = function (file: any, formatMode: number, cb: any) {
    
    //Estensioni permesse
    const fileTypes = getRegexFormats(formatMode);
    
    //check delle estensioni
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    
    if (mimeType && extName) {
        return cb(null, true);
    } else {
        cb(new FileFormatError());
    }
};



// class that provides static middleware methods
class Middleware{

    // secret key used here to verify jwt token
    private static secret : Buffer = fs.readFileSync("./secret");

    // check authorization token
    static async checkAuth ( req : Request, res : Response, next : NextFunction ) {
       try{
            const token = req.headers.authorization;
            // check if token is provided
            if(token){
                // decode token with secret key
                const decoded : any = jwt.verify(token.toString(), Middleware.secret);
                // enrich request params with user id
                req.params.jwtUserId = String(decoded.id).valueOf();
                const authUser = await User.findByPk(req.params.jwtUserId);
                
                let user = null;

                if(!req.params.userId){
                    req.params.userId = req.params.jwtUserId;
                    user = authUser;
                }
                else{
                    const schema = z.coerce.number({ invalid_type_error : "user id must be a number"})
                            .int({ message : "user id must be a integer"});
                    schema.parse(req.params.userId);
                    user = await User.findByPk(req.params.userId);
                }
                
                if (authUser){
                    if (user){
                        req.params.isAdmin = authUser.getDataValue("admin");
                        // admin can access all accounts, normal user can access only his own
                        if(req.params.jwtUserId === req.params.userId || Boolean(req.params.isAdmin).valueOf()){
                            // enrich request params with admin flag and owned credit
                            req.params.credit = user.getDataValue("credit");
                            next();
                        }
                        else
                            throw new MismatchedUser();
                    }
                    else throw new UserNotFound();
                }
                else throw new JsonWebTokenError("invalid jwt");
            }
            else{
                throw new MissingToken();
            }
       }
       catch(err){
        next(err);
       }
    }

    // check if user is dataset's owner or admin
    static async checkDatasetOwner ( req : Request, res : Response, next : NextFunction ) {
        try{

            // validate dataset id
            const schema = z.coerce.number({ invalid_type_error : "dataset id must be a number"})
                            .int({ message : "dataset id must be a integer"});
            schema.parse(req.params.datasetId);

            const dataset = await Dataset.findByPk(req.params.datasetId);

            // check if dataset exists
            if (dataset){
                let datasetOwner = String(dataset.getDataValue("userID")).valueOf();
                // check if dataset owner and user matches
                if (datasetOwner === req.params.jwtUserId || Boolean(req.params.isAdmin).valueOf()){
                    // enrich request params with dataset owner, name and image format
                    req.params.datasetOwner = datasetOwner; // modify dataset routes?
                    req.params.datasetName = dataset.getDataValue("name");
                    req.params.datasetFormat = dataset.getDataValue("format");
                    next();
                }
                else
                    throw new MismatchedDatasetOwner();
            }
            else{
                throw new DatasetNotFound();
            }
        }
        catch(err){
            next(err);
        }
    }

    // check if user is admin
    static async checkAdmin  ( req : Request, res : Response, next : NextFunction ) {
        try {
            if(Boolean(req.params.isAdmin).valueOf())
                next();
            else 
                throw new RestrictedToAdmin();
        }
        catch(err){
            next(err);
        }
    }

    // handle errors thrown by previous middleware methods
    static async errorHandler (err : Error, req : Request, res : Response, next : NextFunction) {
        // create error response object
        let response = ResponseFactory.getErrResponse(err);
        // send response status and message
        res.status(response.status).json(response.message);
    };

    //allow getting files 
    static getUpload(fileFormat: number){ //0 = images, 1 = zip
        return async (req : Request, res : Response, next : NextFunction) => {
            try{
                //if doesn't exist, create the folder of the dataset
                const datasetDir = './images/dataset' + req.params.datasetId
                await fs.mkdir(datasetDir,{recursive: true})

                //multer property to specify the folder where to save the files and how should they be renamed
                const storageEngine = multer.diskStorage({
                    destination: (req, file, cb) => {
                            cb(null, datasetDir);
                        },
                    
                    filename: (req, file, cb) => {
                        //temporary filename to ensure the user can upload a file with the same name as the ones stored in the folder
                        const fileName = 'tmp--' + Date.now() + randomBytes(16).toString(`hex`) + `${file.originalname}`;
                        cb(null, fileName);
                    },
                    
                });
                
                const upload = multer({
                    storage: storageEngine,
                    fileFilter: (req, file, cb) => {checkFileType(file, fileFormat, cb);},
                    
                });
            
                //getting a single file and making it available in the req
                upload.single('file')(req,res, next);

            }catch(error){
                next(error);
            }
        };
    }

}

// builder class to create lists of middleware functions
class MiddlewareBuilder{

    // list of middleware functions
    private middlewares : any[];

    constructor(middlewares? : any[]){
        this.middlewares = middlewares? middlewares : [];
    }

    // return a deep copy of MiddlewareBuilder object
    copy(){
        return new MiddlewareBuilder(this.middlewares.slice());
    }

    // to be deleted
    addCustom( fun : CallableFunction){
        this.middlewares.push(fun);
        return this;
    }

    // add authorization middleware
    addAuth(){
        this.middlewares.push(Middleware.checkAuth);
        return this;
    }

    // add dataset ownership middleware
    addDatasetOwnership(){
        this.middlewares.push(Middleware.checkDatasetOwner);
        return this;
    }

    // add error handling middleware
    addErrorHandling(){
        this.middlewares.push(Middleware.errorHandler);
        return this;
    }

    // add admin authorization middleware
    addAdmin(){
        this.middlewares.push(Middleware.checkAdmin);
        return this;
    }

    addUploader(){
        this.middlewares.push(Middleware.getUpload(0));
        return this;
    }

    addUploaderZip(){
        this.middlewares.push(Middleware.getUpload(1));
        return this;
    }

    // add controller function if specified
    // add error handling middleware by default
    // return list of middleware functions
    
    build(controllerFun? : CallableFunction, err : boolean = true){
        if (controllerFun)
            this.middlewares.push(controllerFun);
        
        if (err)
            this.addErrorHandling();
        
        return this.middlewares;
    }
}

export default MiddlewareBuilder;