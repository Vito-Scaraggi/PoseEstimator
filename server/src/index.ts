import express from 'express'
const bodyParser = require('body-parser')
import sequelize from './utils/database'
import DatasetsRouter from './routes/datasets';

import UsersRouter from './routes/users';
import InferenceRouter from './routes/inference';

const app = express();
async () => ( await sequelize.sync({ alter : true}));

app.use(bodyParser.json());
app.use(UsersRouter);
app.use(DatasetsRouter);
app.use(InferenceRouter);

app.listen(process.env.PORT || 5000, () => { console.log("server started"); });