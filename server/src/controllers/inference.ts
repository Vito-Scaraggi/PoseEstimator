import axios from 'axios'
import express, { Request, Response, NextFunction } from 'express'

import {
	ReasonPhrases,
	StatusCodes,
	getReasonPhrase,
	getStatusCode,
} from 'http-status-codes';

class inferenceController {

    static async startInference(req : Request, res : Response){
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

    static async getStatus(req : Request, res : Response){
        axios.get('http://publisher:3001/status/'+ req.params.job_id).then( (data : any) => {
                //console.log(data);
                res.send(data.data);
            }
        );
    }
}

export default inferenceController;