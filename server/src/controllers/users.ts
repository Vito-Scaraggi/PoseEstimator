import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { randomBytes, pbkdf2Sync } from "crypto";
import fs from "fs"
import { z } from 'zod';

import User from "../models/user";
import { LoginFailed, EmailAlreadyExists } from '../utils/exceptions';
import { successHandler }  from '../utils/response';
import { StatusCodes } from 'http-status-codes';

const createUserSchema = z.object({
    name : z.string({ required_error : "name is required"})
                    .min(2, {message:"name must be 2 or more characters long"})
                    .max(100, {message: "name can't be more than 100 characters long"}),
    surname : z.string({ required_error : "surname is required"})
                    .min(2, {message:"surname must be 2 or more characters long"} )
                    .max(100, {message:"surname can't be more than 100 characters long"}),
    email : z.string({ required_error : "email is required"})
            .email({message : "email is invalid"}),
    password : z.string({ required_error : "password is required"})
                .min(8, {message:"password must be 8 or more characters long"})
                .max(16, {message:"password can't be more than 16 characters long"})
}
);

const updateUserSchema = createUserSchema.partial();

const rechargeSchema = z.object({
    email : z.string({ required_error : "email is required"})
    .email({message : "email is invalid"}),
    credit : z.number({ invalid_type_error : "credit must be a number"})
                .int({ message : "credit must be a integer"})
                .positive({ message : "credit must be greater than zero"})
})

class UsersController{

    private static secret : Buffer = fs.readFileSync("./secret");

    static async getAll(req : Request, res : Response, next : NextFunction) : Promise <void>{
        await User.findAll({ attributes: {exclude: ['password', 'salt']} }).then( (data) => {
            successHandler(res, data );
         })
         .catch( (err) => next(err));
    }

    static async getById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        
        await User.findOne({ where : { id : req.params.jwtUserId}}).then( (data) => {
            successHandler(res, data);
         })
         .catch( (err) => next(err));
    }

    static async updateById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{
            req.body = updateUserSchema.parse(req.body);
            let user = JSON.parse(JSON.stringify(req.body));
            if(user.password){
                user.salt = randomBytes(16).toString(`hex`);
                user.password = pbkdf2Sync(req.body.password, user.salt, 1000, 32, `sha512`).toString(`hex`);
            }
            
            await User.update(user, {where : { id : req.params.jwtUserId}})
                    .catch((err) => {
                    if (err.constructor.name === "UniqueConstraintError")
                        throw new EmailAlreadyExists();
                    else 
                        throw err;
            });
            successHandler(res, "user info updated successfully");
        }
        catch(err){
            next(err);
        }
    }

    static async create(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{
            req.body = createUserSchema.parse(req.body);
            let user = JSON.parse(JSON.stringify(req.body));
            user.salt = randomBytes(16).toString(`hex`);
            user.password = pbkdf2Sync(req.body.password, user.salt, 1000, 32, `sha512`).toString(`hex`);
            await User.create(user).catch((err) => {
                    if (err.constructor.name === "UniqueConstraintError")
                        throw new EmailAlreadyExists();
                    else 
                        throw err;
            })
            .then( (data) =>  successHandler(res, data, StatusCodes.CREATED) );
        }
        catch(err){
            next(err);
        }
    }

    static async deleteById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{
            await User.destroy({where : { id : req.params.jwtUserId}})
            .then( () => successHandler(res, "user deleted successfully") );
        }
        catch(err){
            next(err);
        }
    }

    static async rechargeByEmail(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{
            rechargeSchema.parse(req.body);
            await User.findOne({
                where : {email : req.body.email}
            })    
            .then( (user) => user?.increment({ credit : req.body.credit}));
            successHandler(res, `recharge of ${req.body.credit} for ${req.body.email} executed successfully`);
        }
        catch(err){
            next(err);
        }
    }

    static async getCredit(req : Request, res : Response, next : NextFunction) : Promise <void>{
        successHandler(res, { "credit" : req.params.credit} );
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