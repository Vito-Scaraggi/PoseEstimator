import jwt from 'jsonwebtoken'
import User from "../models/user";
import { Request, Response, NextFunction } from 'express'
import { randomBytes, pbkdf2Sync } from "crypto";
import fs from "fs"

class UsersController{

    private static secret : Buffer = fs.readFileSync("./secret");

    static async getAll(req : Request, res : Response, next : NextFunction) : Promise <void>{
        await User.findAll().then( (data ) => {
            res.send(data);
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
                    res.send({"token" : token});
                }
                else{
                    throw Error("login failed"); 
                }
            } 
        }
        catch(err){
            next(err);
        }        
    }
}

export default UsersController;