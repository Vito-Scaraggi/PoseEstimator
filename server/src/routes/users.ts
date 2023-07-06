import express from 'express'
import usersController from "../controllers/users"

const usersRouter = express.Router()

usersRouter.get("/users/all", usersController.getAll)

export default usersRouter;