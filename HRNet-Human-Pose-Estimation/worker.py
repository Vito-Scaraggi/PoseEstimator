from celery import Celery
from celery.exceptions import Ignore
import os
import subprocess

from lib.wrapper.utils import write_bbox, get_results

# rabbitMQ environment variables
PORT = os.environ.get("PORT") or 5672
RMQ_USER = os.environ.get("RMQ_USER") or "guest"
RMQ_PWD = os.environ.get("RMQ_PWD") or "guest"

# instatiating celery app
app = Celery('tasks', broker=f'amqp://{RMQ_USER}:{RMQ_PWD}@rabbitmq:{PORT}', backend='rpc://')

# inference task function
@app.task(bind=True)
def inference(self, model, dataset, bboxes, img_format = 'png', billed = False):
    try:
        # updating state to RUNNING
        self.update_state(state = "RUNNING")    
        # check if inference invoke has been billed
        if not billed:
            # abort if inference has not been billed
            self.update_state(state = "ABORTED")
            raise Ignore()
        else:
            # getting current task id
            inf_id = self.request.id
            # writing bounding box needed for inference in file
            write_bbox(inf_id, bboxes)
            # building inference command
            command = "python tools/test.py --cfg experiments/babypose/base.yaml"
            command += f" TEST.COCO_BBOX_FILE data/babypose/person_detection_results/results_{inf_id}.json"
            command += f" TEST.MODEL_FILE models/{model}.pth"
            command += f" MODEL.NAME {model}"
            command += f" DATASET.TEST_SET {dataset}"
            command += f" DATASET.DATA_FORMAT {img_format}"
            # launching inference and waiting
            process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
            process.wait()
            # reading results from output file and returning
            return get_results(inf_id, model, dataset)
    except Exception as err:
        # updating state to FAILED if error occurred
        self.update_state( state = "FAILED", 
                            meta = {  'exc_type': type(err).__name__,
                                    'exc_message': str(err)
                                })
        raise Ignore()

# entrypoint
if __name__ == "__main__":
    paths = ["log","output","data","data/babypose",
            "data/babypose/images","data/babypose/person_detection_results"]
    
    for path in paths:
        if not os.path.exists(path):
            os.makedirs(path)

    args = ['worker']
    app.worker_main(argv=args)