import express from 'express'
const bodyParser = require('body-parser')
import InferenceController from './controllers/inference'
import UsersRouter from './routes/users';
import sequelize from './utils/database'

const app = express();
async () => ( await sequelize.sync({ alter : true}));

app.use(bodyParser.json());

app.use(UsersRouter);
app.get('/model/:model/inference/:dataset', InferenceController.startInference);
app.get('/status/:job_id', InferenceController.getStatus);

app.listen(process.env.PORT || 5000, () => { console.log("server started"); });