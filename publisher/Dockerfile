FROM python:3.9-slim-buster
COPY . /publisher
WORKDIR /publisher
RUN pip install -r requirements.txt
ENTRYPOINT python -u main.py