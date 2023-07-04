# ------------------------------------------------------------------------------
# pose.pytorch
# Copyright (c) 2018-present Microsoft
# Licensed under The Apache-2.0 License [see LICENSE for details]
# Written by Bin Xiao (Bin.Xiao@microsoft.com)
# ------------------------------------------------------------------------------

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import os
import pprint
#from flask import Flask, request

import torch
import torch.nn.parallel
import torch.backends.cudnn as cudnn
import torch.optim
import torch.utils.data
import torch.utils.data.distributed
import torchvision.transforms as transforms

from tensorboardX import SummaryWriter

import _init_paths
from config import cfg
from config import update_config
from core.loss import JointsMSELoss, JointsKLDLoss
from core.function import validate
from utils.utils import create_logger
from wrapper.utils import write_bbox, get_results

import dataset
import models

def parse_args():
    parser = argparse.ArgumentParser(description='Train keypoints network')
    # general
    parser.add_argument('--cfg',
                        help='experiment configure file name',
                        required=True,
                        type=str)

    parser.add_argument('opts',
                        help="Modify config options using the command-line",
                        default=None,
                        nargs=argparse.REMAINDER)

    parser.add_argument('--modelDir',
                        help='model directory',
                        type=str,
                        default='')
    parser.add_argument('--logDir',
                        help='log directory',
                        type=str,
                        default='')
    parser.add_argument('--dataDir',
                        help='data directory',
                        type=str,
                        default='')
    parser.add_argument('--prevModelDir',
                        help='prev Model directory',
                        type=str,
                        default='')

    args = parser.parse_args()
    return args

args = parse_args()
update_config(cfg, args)

logger, final_output_dir, tb_log_dir = create_logger(
    cfg, args.cfg, 'valid')

logger.info(pprint.pformat(args))
logger.info(cfg)

writer_dict = {
    'writer': SummaryWriter(log_dir=tb_log_dir),
    'train_global_steps': 0,
    'valid_global_steps': 0,
}

# cudnn related setting
cudnn.benchmark = cfg.CUDNN.BENCHMARK
torch.backends.cudnn.deterministic = cfg.CUDNN.DETERMINISTIC
torch.backends.cudnn.enabled = cfg.CUDNN.ENABLED

model = eval('models.'+cfg.MODEL.NAME+'.get_pose_net')(
    cfg, is_train=False
)

if cfg.TEST.MODEL_FILE:
    logger.info('=> loading model from {}'.format(cfg.TEST.MODEL_FILE))
    model.load_state_dict(torch.load(cfg.TEST.MODEL_FILE, map_location=torch.device('cpu')), strict=False)
else:
    model_state_file = os.path.join(
        final_output_dir, 'final_state.pth'
    )
    logger.info('=> loading model from {}'.format(model_state_file))
    model.load_state_dict(torch.load(model_state_file, map_location=torch.device('cpu')))

model = torch.nn.DataParallel(model, device_ids=cfg.GPUS).cpu()

# define loss function (criterion) and optimizer
criterion = JointsMSELoss(
    use_target_weight=cfg.LOSS.USE_TARGET_WEIGHT
).cpu()

criterion_kld = JointsKLDLoss().cpu()

# Data loading code
normalize = transforms.Normalize(
    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
)
valid_dataset = eval('dataset.'+cfg.DATASET.DATASET)(
    cfg, cfg.DATASET.ROOT, cfg.DATASET.TEST_SET, False,
    transforms.Compose([
        transforms.ToTensor(),
        normalize,
    ])
)
valid_loader = torch.utils.data.DataLoader(
    valid_dataset,
    batch_size=cfg.TEST.BATCH_SIZE_PER_GPU*len(cfg.GPUS),
    shuffle=False,
    num_workers=cfg.WORKERS,
    pin_memory=True
)

'''
app = Flask(__name__)

@app.route("/infer/<inf_id>", methods=['POST'])
def infer(inf_id):
    cfg.TEST.COCO_BBOX_FILE = f"data/babypose/person_detection_results/results_{inf_id}.json"
    img_ids = request.form["img_ids"]
    bboxes = request.form["bboxes"]
    write_bbox(inf_id, img_ids, bboxes)
    validate(cfg, valid_loader, valid_dataset, model, criterion, criterion_kld,
             final_output_dir, tb_log_dir, writer_dict)
    return(get_results())

if __name__ == "__main__":
    app.run(host='0.0.0.0',port='8080')
'''