import User from "../models/user";
import { Request, Response, NextFunction } from 'express'

class UsersController{
    static async getAll(req : Request, res : Response) : Promise <void>{
        await User.findAll().then( (data : any) => {
            res.send(data);
         }
         );
    }
}

export default UsersController;