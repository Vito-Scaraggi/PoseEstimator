import express from 'express'
import UsersController from "../controllers/users"

const UsersRouter = express.Router()

UsersRouter.get("/users/all", UsersController.getAll)

export default UsersRouter;