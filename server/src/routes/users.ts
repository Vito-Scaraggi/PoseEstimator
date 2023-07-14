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
            .get("/user/credit/:userId?", authMW.copy()
                            .build(C.getCredit) )
            .post("/user/recharge", authMW.copy()
                            .addAdmin()
                            .build(C.rechargeByEmail) )
            .get("/user/:userId?", authMW.copy()
                            .build(C.getById) )
            .post("/user", new MWBuilder()
                            .build(C.create) )
            .put("/user/:userId?", authMW.copy()
                            .build(C.updateById) )
            .delete("/user/:userId?", authMW.copy()
                            .build(C.deleteById) )
            .post("/login", new MWBuilder()
                            .build(C.login) )

export default UsersRouter;