
#from wrapper.utils import write_bbox, get_results
import subprocess

if __name__ == "__main__":
    #inf_id = 1
    #img_ids = [12474, 12361]
    #bboxes = [[251, 34, 208, 373], [204, 129, 195, 299]]
    #write_bbox(inf_id, img_ids, bboxes)
    command = f"""python tools/test.py --cfg experiments/babypose/hrnet/2_stage_coco_lr_7-5e-4.yaml"""
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
    process.wait()
    #get_results()