import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { randomBytes, pbkdf2Sync } from "crypto";
import fs from "fs"
import { z } from 'zod';

import User from "../models/user";
import { LoginFailed, EmailAlreadyExists, UserNotFound } from '../utils/exceptions';
import { successHandler }  from '../utils/response';
import { StatusCodes } from 'http-status-codes';

// validation schema for create user request
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

/* validation schema for update user request
    .partial() makes all schema properties optional
*/
const updateUserSchema = createUserSchema.partial();

//  validation schema for recharge user request
const rechargeSchema = z.object({
    email : z.string({ required_error : "email is required"})
    .email({message : "email is invalid"}),
    credit : z.number({ invalid_type_error : "credit must be a number"})
                .int({ message : "credit must be a integer"})
                .positive({ message : "credit must be greater than zero"})
})

// Controller class for handling user routes
class UsersController{

    // secret key used here to forge new jwt tokens
    private static secret : Buffer = fs.readFileSync("./secret");

    // return all users hiding password and salt
    static async getAll(req : Request, res : Response, next : NextFunction) : Promise <void>{
        await User.findAll({ attributes: {exclude: ['password', 'salt']} }).then( (data) => {
            successHandler(res, data );
         })
         .catch( (err) => next(err));
    }

    // return user with given id hiding salt
    static async getById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        
        await User.findByPk( req.params.jwtUserId, { attributes : { exclude : ['salt']}}).then( (data) => {
            successHandler(res, data);
         })
         .catch( (err) => next(err));
    }

    // update user with given id
    static async updateById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{

            // validate user info
            req.body = updateUserSchema.parse(req.body);
            let user = JSON.parse(JSON.stringify(req.body));
            
            // compute random salt and hash password
            if(user.password){
                user.salt = randomBytes(16).toString(`hex`);
                user.password = pbkdf2Sync(req.body.password, user.salt, 1000, 32, `sha512`).toString(`hex`);
            }
            
            // update user row into db
            await User.update(user, {where : { id : req.params.jwtUserId}})
                    .catch((err) => {
                    // email not unique error
                    if (err.constructor.name === "UniqueConstraintError")
                        throw new EmailAlreadyExists();
                    else 
                        throw err;
            });
            
            const updatedUser = await User.findByPk(req.params.jwtUserId, { attributes : { exclude : ['salt']}} ); 
            successHandler(res, updatedUser);
        }
        catch(err){
            next(err);
        }
    }

    // create new user with provided info
    static async create(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{
            // validate user info
            req.body = createUserSchema.parse(req.body);
            let user = JSON.parse(JSON.stringify(req.body));
            
            // compute random salt and hash password
            user.salt = randomBytes(16).toString(`hex`);
            user.password = pbkdf2Sync(req.body.password, user.salt, 1000, 32, `sha512`).toString(`hex`);
            
            // create new user row into db
            await User.create(user).catch((err) => {
                    // email not unique error
                    if (err.constructor.name === "UniqueConstraintError")
                        throw new EmailAlreadyExists();
                    else 
                        throw err;
            })
            .then( (data) =>  {
                    let result = data.toJSON()
                    delete result["salt"];
                    successHandler(res, result, StatusCodes.CREATED) 
            });
        }
        catch(err){
            next(err);
        }
    }

    // delete user with given id
    static async deleteById(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{
            const user = await User.findByPk(req.params.jwtUserId, { attributes : { exclude : ['salt']}} );
            await User.destroy({where : { id : req.params.jwtUserId}})
            .then( () => successHandler(res, user) );
        }
        catch(err){
            next(err);
        }
    }

    // recharge credit of user with given email
    static async rechargeByEmail(req : Request, res : Response, next : NextFunction) : Promise <void>{
        try{
            // validate request body
            rechargeSchema.parse(req.body);
            const user = await User.findOne({where : {email : req.body.email}});
            
            // recharge user credit if exists
            if(user){
                user.increment({ credit : req.body.credit});
                successHandler(res, `recharge of ${req.body.credit} credits for ${req.body.email} executed successfully`);
            }
            else throw new UserNotFound("no user found with given email");
        }
        catch(err){
            next(err);
        }
    }

    // get credit of user
    static async getCredit(req : Request, res : Response, next : NextFunction) : Promise <void>{
        successHandler(res, { "credit" : Number(req.params.credit).toFixed(2) } );
    }

    // login user and forge jwt token
    static async login (req : Request, res : Response, next : NextFunction) : Promise <void> {
        try{
            // find user with login email
            const user = await User.findOne( { where : { email : req.body.email }} );
            if(user){
                // compute hash of password using salt saved into db
                const hash = pbkdf2Sync(req.body.password, user.getDataValue("salt"), 1000, 32, `sha512`).toString(`hex`);
                // compare hashed password with that saved into db
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