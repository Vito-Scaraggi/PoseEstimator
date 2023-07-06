import express, { Request, Response, NextFunction } from 'express'
const bodyParser = require('body-parser')
import axios from 'axios'

import {
	ReasonPhrases,
	StatusCodes,
	getReasonPhrase,
	getStatusCode,
} from 'http-status-codes';

const app = express();

//implement message object class for errors
const errorHandler = (err : Error, req : Request, res : Response, next : NextFunction) => {
    //res.send(JSON.stringify(err));
    res.send( `${err.message}` );
};

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/model/:model/inference/:dataset', 
    (req : Request, res : Response) => {
        let model : string = req.params.model
        let dataset : string = req.params.dataset
        //hard coded
        let bboxes =  {
            "bboxes" : [ {
                            "image_id" : 12474,
                            "bbox" : [220, 65, 200, 350]
                        }
                    ]
            }

        axios.post('http://publisher:3001/model/' + model + '/inference/' + dataset, 
                bboxes)
                .then( (data : any) => {
                    //console.log(data);
                    res.send(data.data);
                })
                .catch( (err: any) => {
                    console.log(err);
                    res.send("error");
                });
    }
);

app.get('/status/:job_id', 
    (req : Request, res : Response) => {
        axios.get('http://publisher:3001/status/'+ req.params.job_id).then( (data : any) => {
                //console.log(data);
                res.send(data.data);
            }
        );
    }
);

app.listen(5000);