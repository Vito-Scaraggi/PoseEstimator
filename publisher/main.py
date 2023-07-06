
#from wrapper.utils import write_bbox, get_results
from flask import Flask, request
from celery import Celery, states
import os

PORT = os.environ.get("PORT") or 5672
RMQ_USER = os.environ.get("RMQ_USER") or "guest"
RMQ_PWD = os.environ.get("RMQ_PWD") or "guest"

celery = Celery('tasks', broker=f'amqp://{RMQ_USER}:{RMQ_PWD}@rabbitmq:{PORT}', backend='rpc://')
api = Flask(__name__)

@api.post("/model/<string:model>/inference/<string:dataset>")
def inference(model, dataset):
    bboxes = request.json["bboxes"]
    task = celery.send_task("tasks.inference", (model, dataset, bboxes))
    id = task.id
    status = celery.AsyncResult(id, app = celery).state
    return {
        "id" : id,
        "status" : status
    }

@api.get("/status/<string:id>")
def status(id):
    status = celery.AsyncResult(id, app = celery).state
    #add custom states or convert   
    ret = {
        "id" : id,
        "status" : status
    }
    
    if status == states.SUCCESS:
        result = celery.AsyncResult(id, app = celery).result
        ret["result"] = result
    
    return ret

if __name__ == "__main__":
    API_PORT = os.environ.get("API_PORT") or 3001
    api.run(host = "0.0.0.0", port = API_PORT)