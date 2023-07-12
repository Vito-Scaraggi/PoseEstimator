import express from 'express'

import C from "../controllers/users"
import MWBuilder from '../middlewares/middleware';

// user router instantiation
const UsersRouter = express.Router()

// simple authorization middleware
const authMW = new MWBuilder().addAuth();

// user routes definition
UsersRouter.get("/user/all", new MWBuilder()
                            .build(C.getAll) )
            .get("/user", authMW.copy()
                            .build(C.getById) )
            .post("/user", new MWBuilder()
                            .build(C.create) )
            .put("/user", authMW.copy()
                            .build(C.updateById) )
            .delete("/user", authMW.copy()
                            .build(C.deleteById) )
            .get("/user/credit", authMW.copy()
                            .build(C.getCredit) )
            .post("/user/recharge", authMW.copy()
                            .addAdmin()
                            .build(C.rechargeByEmail) )
            .post("/login", new MWBuilder()
                            .build(C.login) )

export default UsersRouter;