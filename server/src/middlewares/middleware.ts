import {Request, Response, NextFunction} from 'express';
import jwt  from 'jsonwebtoken';
import fs from 'fs';
import ResponseFactory from '../utils/response';

import { MissingToken } from '../utils/exceptions';

class Middleware{

    private static secret : Buffer = fs.readFileSync("./secret");

    static checkAuth ( req : Request, res : Response, next : NextFunction ) {
       try{
            const token = req.headers.authorization;
           
            if(token){
                const decoded : any = jwt.verify(token.toString(), Middleware.secret);
                req.params.user_id = decoded.id;
                next();
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
        next();
    }

    static async checkAccountOwner ( req : Request, res : Response, next : NextFunction ) {
        next();
    }

    static async checkAdmin  ( req : Request, res : Response, next : NextFunction ) {
        next();
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

    addAccountOwnership(){
        this.middlewares.push(Middleware.checkAccountOwner);
        return this;
    }

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

    build(){
        return this.middlewares;
    }

    buildWithErr(){
        this.addErrorHandling();
        return this.middlewares;
    }

}

export default MiddlewareBuilder;