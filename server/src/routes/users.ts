import express from 'express'

import C from "../controllers/users"
import MWBuilder from '../middlewares/middleware';

const UsersRouter = express.Router()

//add other routes here
UsersRouter.get("/user/all", new MWBuilder()
                            .addCustom(C.getAll)
                            .build() 
            )
            .get("/user", new MWBuilder()
                        .addAuth()
                        .addCustom(C.getById)
                        .build()
            )
            .post("/user", new MWBuilder()
                        .addCustom(C.create)
                        .build()
            )
            .put("/user", new MWBuilder()
                        .addAuth()
                        .addCustom(C.updateById)
                        .build()
            )
            .delete("/user", new MWBuilder()
                        .addAuth()
                        .addCustom(C.deleteById)
                        .build()
            )
            .get("/user/credit", new MWBuilder()
                                .addAuth()
                                .addCustom(C.getCredit)
                                .build()
            )
            .post("/user/recharge", new MWBuilder()
                                .addAuth()
                                .addAdmin()
                                .addCustom(C.rechargeByEmail)
                                .build()
            )
            .post("/login", new MWBuilder()
                                .addCustom(C.login)
                                .build()
            )

export default UsersRouter;