
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
    ret = {}
    try:
        kwargs = {
            "model" : model,
            "dataset" : dataset,
            "bboxes" : request.json.get("bboxes"),
            "img_format" : request.json.get("img_format") or 'png',
            "billed" : request.json.get("billed") or False
        }

        task = celery.send_task("tasks.inference", kwargs = kwargs)
        
        ret["id"] = task.id
        ret["status"] = celery.AsyncResult(task.id, app = celery).state
    except Exception as err:
        ret["error"] = str(err)
    finally:
        return  ret

@api.get("/status/<string:id>")
def status(id):
    ret = {'id' : id}
    try:
        status = celery.AsyncResult(id, app = celery).state
        status = "COMPLETED" if status == "SUCCESS" else status
        ret["status"] = status

        if status == 'COMPLETED':
            ret["result"] = celery.AsyncResult(id, app = celery).result

        if status == 'FAILED':
            ret["error"] = celery.AsyncResult(id, app = celery).info.get("exc_type")
            #ret["message"] = celery.AsyncResult(id, app = celery).info.get("exc_message")

    except Exception as err:
        ret["error"] = str(err)
    finally:
        return ret

if __name__ == "__main__":
    API_PORT = os.environ.get("API_PORT") or 3001
    api.run(host = "0.0.0.0", port = API_PORT)