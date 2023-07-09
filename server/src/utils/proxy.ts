import axios from 'axios'

class SingletonProxy {
    
    private base_url : string;
    private jobs_cache : { [key:string] : any };

    private static instance : SingletonProxy;
    private static FINAL_STATES = ["FAILED", "ABORTED", "COMPLETED"];

    private constructor(){
        this.base_url =  'http://publisher:' + process.env.API_PORT;
        this.jobs_cache = {};
    }

    async inference(model : string, dataset : string, data : { [key:string] : any }) {
        let req_body = data;
        return await axios.post( this.base_url + "/model/" + model + '/inference/' + dataset, req_body)
                .then( (data) => {
                    return data.data;
                })
    }

    async status(job_id : string) {
        let cached_job = this.jobs_cache[job_id]

        if(cached_job && SingletonProxy.FINAL_STATES.includes(cached_job["status"]))
            return cached_job;
        
        return await axios.get( this.base_url + '/status/'+ job_id).then( (data) => {
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

export default SingletonProxy;