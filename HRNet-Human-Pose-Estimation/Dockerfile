FROM python:3.9-slim-buster
COPY . /HRNet-Human-Pose-Estimation
WORKDIR /HRNet-Human-Pose-Estimation
RUN apt update && apt install -y make gcc libgl1 libglib2.0-0 && pip install -r requirements.txt && cd lib && make
ENTRYPOINT python -u worker.py