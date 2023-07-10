import {Request, Response, NextFunction} from 'express';
import jwt  from 'jsonwebtoken';
import fs from 'fs';
import { z } from 'zod';

import ResponseFactory from '../utils/response';
import { MissingToken, MismatchedUser, RestrictedToAdmin, MismatchedDatasetOwner,
        UserNotFound, DatasetNotFound} from '../utils/exceptions';
import User from '../models/user';
import Dataset from '../models/dataset';

class Middleware{

    private static secret : Buffer = fs.readFileSync("./secret");

    static async checkAuth ( req : Request, res : Response, next : NextFunction ) {
       try{
            const token = req.headers.authorization;
            if(token){
                const decoded : any = jwt.verify(token.toString(), Middleware.secret);
                req.params.jwtUserId = decoded.id;
                const user = await User.findOne( { where : { id : req.params.jwtUserId } } );
                if (user){
                    req.params.isAdmin = user.getDataValue("admin");
                    req.params.credit = user.getDataValue("credit");
                    next();
                }
                else throw new UserNotFound();
            }
            else{
                throw new MissingToken();
            }
       }
       catch(err){
        next(err);
       }
    }

    static async checkDatasetOwner ( req : Request, res : Response, next : NextFunction ) {
        try{

            const schema = z.coerce.number({ invalid_type_error : "dataset id must be a number"})
                            .int({ message : "dataset id must be a integer"});
            schema.parse(req.params.datasetId);

            const dataset = await Dataset
                                .findOne( { where : { id : req.params.datasetId}});
            
            if (dataset){
                let datasetOwner = dataset.getDataValue("userID");
                
                if (datasetOwner === req.params.jwtUserId){
                    req.params.datasetName = dataset.getDataValue("name");
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

    /*
    static checkAccountOwner ( req : Request, res : Response, next : NextFunction ) {
        try{
            if(req.params.jwtUserId === req.params.userId)
                next();
            else
                throw new MismatchedUser();
        }
        catch(err){
            next(err);
        }
    }
    */

    static async checkAdmin  ( req : Request, res : Response, next : NextFunction ) {
        try {
            if(Boolean(req.params.isAdmin).valueOf() === true)
                next();
            else 
                throw new RestrictedToAdmin();
        }
        catch(err){
            next(err);
        }
    }

    static async errorHandler (err : Error, req : Request, res : Response, next : NextFunction) {
        let response = ResponseFactory.getErrResponse(err);
        res.status(response.status).send(response.message);
    };
}

class MiddlewareBuilder{

    private middlewares : any[];

    constructor(){
        this.middlewares = [];
    }

    addCustom( fun : CallableFunction){
        this.middlewares.push(fun);
        return this;
    }

    addAuth(){
        this.middlewares.push(Middleware.checkAuth);
        return this;
    }

    /*
    addAccountOwnership(){
        this.middlewares.push(Middleware.checkAccountOwner);
        return this;
    }
    */

    addDatasetOwnership(){
        this.middlewares.push(Middleware.checkDatasetOwner);
        return this;
    }

    addErrorHandling(){
        this.middlewares.push(Middleware.errorHandler);
        return this;
    }

    addAdmin(){
        this.middlewares.push(Middleware.checkAdmin);
        return this;
    }

    build(err : boolean = true){
        if (err)
            this.addErrorHandling();
        return this.middlewares;
    }

}

export default MiddlewareBuilder;