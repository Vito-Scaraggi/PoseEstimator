import axios from 'axios'

// class that proxies request sent to flask publisher
class SingletonProxy {
    
    // publisher url
    private base_url : string;
    // cache for job results
    private jobs_cache : { [key:string] : any };
    // private singleton instance
    private static instance : SingletonProxy;
    // jobs' final states
    private static FINAL_STATES = ["FAILED", "ABORTED", "COMPLETED"];

    private constructor(){
        this.base_url =  'http://publisher:' + process.env.API_PORT;
        this.jobs_cache = {};
    }

    // send a inference request to publisher
    async inference(model : string, dataset : string, data : { [key:string] : any }) {
        let req_body = data;
        // send a post request with given data
        return await axios.post( this.base_url + "/model/" + model + '/inference/' + dataset, req_body)
                .then( (data) => {
                    return data.data;
                })
    }
    
    // send a request to publish for getting job status
    async status(job_id : string) {

        // check if given job has been cached when it occurred in one of FINAL STATES
        // in this case, return cached job
        let cached_job = this.jobs_cache[job_id]
        if(cached_job && SingletonProxy.FINAL_STATES.includes(cached_job["status"]))
            return cached_job;
        
        // send a get request if job has not been cached
        // or it is still PENDING or RUNNING 
        return await axios.get( this.base_url + '/status/'+ job_id).then( (data) => {
                this.jobs_cache[job_id] = data.data;
                return data.data;
        });
    }

    // return singleton instance of Proxy
    static getInstance(){
        if ( !SingletonProxy.instance) 
            SingletonProxy.instance = new SingletonProxy();
        
        return SingletonProxy.instance;
    }

}

export default SingletonProxy;