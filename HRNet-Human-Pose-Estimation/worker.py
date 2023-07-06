from celery import Celery
from celery.exceptions import Ignore
import os
import subprocess

from lib.wrapper.utils import write_bbox, get_results

PORT = os.environ.get("PORT") or 5672
RMQ_USER = os.environ.get("RMQ_USER") or "guest"
RMQ_PWD = os.environ.get("RMQ_PWD") or "guest"

app = Celery('tasks', broker=f'amqp://{RMQ_USER}:{RMQ_PWD}@rabbitmq:{PORT}', backend='rpc://')

@app.task(bind=True)
def inference(self, model, dataset, bboxes, img_format = 'png', billed = False):
    self.update_state(state = "RUNNING")    
    if not billed:
        self.update_state(state = "ABORTED")
        raise Ignore()
    else:
        try:
            inf_id = self.request.id
            write_bbox(inf_id, bboxes)
            command = "python tools/test.py --cfg experiments/babypose/base.yaml"
            command += f" TEST.COCO_BBOX_FILE data/babypose/person_detection_results/results_{inf_id}.json"
            command += f" TEST.MODEL_FILE models/{model}.pth"
            command += f" MODEL.NAME {model}"
            command += f" DATASET.TEST_SET {dataset}"
            command += f" DATASET.DATA_FORMAT {img_format}"
            process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
            process.wait()
            return get_results(inf_id, model, dataset)
        except Exception as err:
            self.update_state( state = "FAILED", 
                               meta = {  'exc_type': type(err).__name__,
                                        'exc_message': str(err)
                                    })
            raise Ignore()

if __name__ == "__main__":
    args = ['worker']
    app.worker_main(argv=args)