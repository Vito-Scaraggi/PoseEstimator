import express, { Request, Response, NextFunction } from 'express'
const bodyParser = require('body-parser')
import sequelize from './utils/database'
import DatasetsRouter from './routes/datasets';

import UsersRouter from './routes/users';
import InferenceRouter from './routes/inference';

const app = express();
async () => ( await sequelize.sync({ alter : true, force : true}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use((request: Request, response: Response, next: NextFunction) => {
    response.set('Access-Control-Allow-Origin', '*')
    response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    next()
})

app.use(UsersRouter);
app.use(DatasetsRouter);
app.use(InferenceRouter);

app.listen(process.env.PORT || 5000, () => { console.log("server started"); });