import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { randomBytes, pbkdf2Sync } from "crypto";
import fs from "fs"
import { z } from 'zod';

import User from "../models/user";
import { LoginFailed } from '../utils/exceptions';
import { successHandler }  from '../utils/response';

class UsersController{

    private static secret : Buffer = fs.readFileSync("./secret");

    static async getAll(req : Request, res : Response, next : NextFunction) : Promise <void>{
        await User.findAll().then( (data) => {
            successHandler(res, JSON.parse(JSON.stringify(data)) );
         })
         .catch( (err) => next(err));
    }

    static async getById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        
        await User.findOne({ where : { id : req.params.jwtUserId}}).then( (data) => {
            successHandler(res, JSON.parse(JSON.stringify(data)) );
         })
         .catch( (err) => next(err));
    }

    static async updateById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        
    }

    static async create(req : Request, res : Response, next : NextFunction) : Promise <void>{

    }

    static async deleteById(req : Request, res : Response, next : NextFunction) : Promise <void>{

    }

    static async rechargeByEmail(req : Request, res : Response, next : NextFunction) : Promise <void>{

    }

    static async getCredit(req : Request, res : Response, next : NextFunction) : Promise <void>{
        console.log("here");
        await User.findOne({ where : { id : req.params.jwtUserId}}).then( (data) => {
            successHandler(res, { "credit" : data?.getDataValue("credit") } );
         })
         .catch( (err) => next(err));
    }

    static async login (req : Request, res : Response, next : NextFunction) : Promise <void> {
        try{
            const user = await User.findOne( { where : { email : req.body.email }} );
            if(user){
                const hash = pbkdf2Sync(req.body.password, user.getDataValue("salt"), 1000, 32, `sha512`).toString(`hex`);
                if (hash === user.getDataValue("password")){
                    const token =  jwt.sign({ id : user.getDataValue("id")}, UsersController.secret, {expiresIn : "1d"});
                    successHandler(res, {"token" : token});
                }
                else{
                    throw new LoginFailed(); 
                }
            }
            else
                throw new LoginFailed(); 
        }
        catch(err){
            next(err);
        }        
    }
}

export default UsersController;