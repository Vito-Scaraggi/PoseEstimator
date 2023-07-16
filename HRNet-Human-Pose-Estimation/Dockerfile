FROM python:3.9-slim-buster
COPY . /HRNet-Human-Pose-Estimation
WORKDIR /HRNet-Human-Pose-Estimation
RUN apt update && apt install -y make gcc libgl1 libglib2.0-0 && pip install -r requirements.txt && mkdir log output data data/babypose data/babypose/images data/babypose/person_detection_results && cd lib && make  
ENTRYPOINT python -u worker.py