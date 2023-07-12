import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser';
import sequelize from './utils/database'
import DatasetsRouter from './routes/datasets';

import UsersRouter from './routes/users';
import ModelRouter from './routes/model';
import InferenceRouter from './routes/inference';

// server declaration
const app = express();

// db sync
async () => ( await sequelize.sync({ alter : true, force : true}));


// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// headers
app.use((request: Request, response: Response, next: NextFunction) => {
    response.set('Access-Control-Allow-Origin', '*')
    response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    next()
})

// routing
app.use(UsersRouter);
app.use(DatasetsRouter);
app.use(InferenceRouter);
app.use(ModelRouter);

// running server
app.listen(process.env.PORT || 5000, () => { console.log("server started"); });