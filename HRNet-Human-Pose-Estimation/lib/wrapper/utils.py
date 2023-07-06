import json
import os

def get_results(inf_id, model_name, dataset_name):

    in_path = f"output/babypose/{model_name}/base/results/keypoints_{dataset_name}_results_{inf_id}.json"
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
                "keypoints" : [ { "joint" : j, "x" : x , "y" : y } 
                                for j,x,y in 
                                zip(joints, elem["keypoints"][0::3], elem["keypoints"][1::3]) ],
                "score" : elem["score"] 
            }
            )
    return ret

def write_bbox(inf_id, bboxes):
    default_bbox = [220, 65, 200, 350]

    out_path = "data/babypose/person_detection_results"
    filename = f"results_{inf_id}.json"
    filepath = os.path.join(out_path, filename)
    
    ret = []
    
    for elem in bboxes:
        ret.append({
                "image_id" : elem.get("image_id"),
                "bbox" : elem.get("bbox") or default_bbox,
                "category_id" : 3,
                "score" : 1
        })

    with open(filepath, "w") as f:
        json.dump(ret, f)