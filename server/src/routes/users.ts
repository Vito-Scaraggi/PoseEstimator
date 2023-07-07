import express from 'express'

import UsersController from "../controllers/users"
import MWBuilder from '../middlewares/middleware';

const UsersRouter = express.Router()
UsersRouter.get("/users/all", new MWBuilder().addCustom( UsersController.getAll).buildWithErr() )
            .post("/login", new MWBuilder().addCustom(UsersController.login).buildWithErr() );
export default UsersRouter;