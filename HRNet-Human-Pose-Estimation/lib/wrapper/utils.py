import json
import os
import subprocess

def get_results():

    in_path = "output/babypose/multi_out_pose_hrnet/2_stage_coco_lr_7-5e-4/results/keypoints_test_results_0.json"
    joints = [  "right_hand",
                "right_elbow",
                "right_shoulder",
                "left_shoulder ",
                "left_elbow",
                "left_hand",
                "right_foot",
                "right_knee",
                "right_hip",
                "left_hip",
                "left_knee",
                "left_foot"
            ]
    ret = []
    with open(in_path, "r") as f:
        results = json.load(f)
        for elem in results:
            ret.append( {
                "image_id" : elem["image_id"],
                "keypoints" : [ { "x" : int(x) , "y" : int(y) } 
                                for x,y in 
                                zip(elem["keypoints"][0::3], elem["keypoints"][1::3]) ],
                "score" : elem["score"] 
            }
            )
    print(ret)
    #return ret

def write_bbox(inf_id, img_ids, bboxes):
    out_path = "data/babypose/person_detection_results"
    filename = f"results_{inf_id}.json"
    filepath = os.path.join(out_path, filename)
    
    with open(filepath, "w") as f:
        ret = []
        for id, bbox in zip(img_ids, bboxes):
            ret.append({
                "image_id" : id,
                "bbox" : bbox,
                "category_id" : 3,
                "score" : 1
            })
        json.dump(ret, f)

'''
if __name__ == "__main__":
    inf_id = 1
    img_ids = [12474, 12361]
    bboxes = [[251, 34, 208, 373], [204, 129, 195, 299]]
    write_bbox(inf_id, img_ids, bboxes)
    command = f"""python tools/test.py --cfg experiments/babypose/hrnet/2_stage_coco_lr_7-5e-4.yaml TEST.COCO_BBOX_FILE data/babypose/person_detection_results/results_{inf_id}.json"""
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
    process.wait()
    get_results()
'''