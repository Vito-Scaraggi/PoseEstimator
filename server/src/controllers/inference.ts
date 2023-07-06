import axios from 'axios'
import express, { Request, Response, NextFunction } from 'express'

import {
	ReasonPhrases,
	StatusCodes,
	getReasonPhrase,
	getStatusCode,
} from 'http-status-codes';

type inferenceData = {
    bboxes : {"image_id" : number, "bbox" : number[] } [],
    billed? : boolean,
    img_format? : string
}

class SingletonProxy {
    
    private base_url : string;
    private jobs_cache : { [key:string] : any};
    private static instance : SingletonProxy;
    private static FINAL_STATES = ["FAILED", "ABORTED", "COMPLETED"];

    private constructor(){
        this.base_url =  'http://publisher:' + process.env.API_PORT;
        this.jobs_cache = {};
    }

    async inference(model : string, dataset : string, data : inferenceData) {
        let req_body = data;
        return await axios.post( this.base_url + "/model/" + model + '/inference/' + dataset, req_body)
                .then( (data : any) => {
                    //console.log(data);
                    return data.data;
                })
    }

    async status(job_id : string) {
        let cached_job = this.jobs_cache[job_id]

        if(cached_job && SingletonProxy.FINAL_STATES.includes(cached_job["status"]))
            return cached_job;
        
        return await axios.get( this.base_url + '/status/'+ job_id).then( (data : any) => {
                this.jobs_cache[job_id] = data.data;
                return data.data;
        });
    }

    static getInstance(){
        if ( !SingletonProxy.instance) 
            SingletonProxy.instance = new SingletonProxy();
        
        return SingletonProxy.instance;
    }

}

class InferenceController {

    static async startInference(req : Request, res : Response){
        let model : string = req.params.model
        let dataset : string = req.params.dataset
        //hard coded
        let data =  {
            bboxes : [ {
                            image_id : 12474,
                            bbox : [220, 65, 200, 350]
                        }
                    ],
            billed : true
        }

        let proxy = SingletonProxy.getInstance();
        
        await proxy.inference(model, dataset, data)
        .then( (data : any) => res.send(data) )
        .catch( ( err : any) => res.send(err) );
    }

    static async getStatus(req : Request, res : Response){
        
        let proxy = SingletonProxy.getInstance();

        await proxy.status(req.params.job_id)
        .then( (data : any) => res.send(data))
        .catch( ( err : any) => res.send(err) );
    }
}

export default InferenceController;