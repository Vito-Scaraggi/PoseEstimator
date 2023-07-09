import express from 'express'

import C from "../controllers/users"
import MWBuilder from '../middlewares/middleware';

const UsersRouter = express.Router()

//add other routes here
UsersRouter.get("/users/all", new MWBuilder().addCustom(C.getAll).build() )
            .get("/user", new MWBuilder().addAuth().addCustom(C.getById).build())
            .get("/user/credit", new MWBuilder().addAuth().addCustom(C.getCredit).build())
            .post("/login", new MWBuilder().addCustom(C.login).build() );

export default UsersRouter;