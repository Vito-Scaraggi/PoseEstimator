import express from 'express'
const bodyParser = require('body-parser')
import inferenceController from './controllers/inference'
import usersRouter from './routes/users';
import sequelize from './utils/database'

const app = express();
async () => ( await sequelize.sync({ alter : true}));

app.use(bodyParser.json());

app.use(usersRouter);
app.get('/model/:model/inference/:dataset', inferenceController.startInference);
app.get('/status/:job_id', inferenceController.getStatus);

app.listen(process.env.PORT || 5000, () => { console.log("server started"); });