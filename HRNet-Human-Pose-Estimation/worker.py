from celery import Celery
import os
import subprocess

from lib.wrapper.utils import write_bbox, get_results

PORT = os.environ.get("PORT") or 5672
RMQ_USER = os.environ.get("RMQ_USER") or "guest"
RMQ_PWD = os.environ.get("RMQ_PWD") or "guest"

app = Celery('tasks', broker=f'amqp://{RMQ_USER}:{RMQ_PWD}@rabbitmq:{PORT}', backend='rpc://')

@app.task(bind=True)
def inference(self, model_name, dataset_name, bboxes = []):
    inf_id = self.request.id
    write_bbox(inf_id, bboxes)
    command = "python tools/test.py --cfg experiments/babypose/base.yaml"
    command += f" TEST.COCO_BBOX_FILE data/babypose/person_detection_results/results_{inf_id}.json"
    command += f" TEST.MODEL_FILE models/{model_name}.pth"
    command += f" MODEL.NAME {model_name}"
    command += f" DATASET.TEST_SET {dataset_name}"
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
    process.wait()
    return get_results(inf_id, model_name, dataset_name)

if __name__ == "__main__":
    args = ['worker']
    app.worker_main(argv=args)