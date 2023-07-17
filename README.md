# PoseEstimator
## Obiettivo del progetto
**PoseEstimator** è una API in [Express.js](https://expressjs.com/) che permette di fare inferenza su immagini utilizzando la rete neurale [HRNet](https://github.com/Vito-Scaraggi/HRNet-Human-Pose-Estimation) per il *task* di stima della posa. Il modello è stato addestrato per la *Keypoint Detection* su immagini di profondità di bambini nati prematuri ([BabyposeDataset](https://link.springer.com/article/10.1007/s11517-022-02696-9)).

## Indice
- [Progettazione](#progettazione)
  - [Architettura dei servizi docker](#architettura-dei-servizi-docker)
  - [Diagramma dei casi d'uso](#diagramma-dei-casi-duso)
  - [Schema database](#schema-database)
  - [Pattern architetturale](#pattern-architetturale)
  - [Design Pattern](#design-pattern)
  - [Diagrammi di sequenza](#diagrammi-di-sequenza)
- [API](#api)
- [Quickstart](#quick-start)
- [Testing](#testing)

## Progettazione
### Architettura dei servizi docker 

```mermaid
  flowchart LR;
      user[user] -->|API request| server
      
      subgraph <b>docker services</b>
      
      server[backend <div> <b> node.js];
      db[(database <div> <b> postgres)];
      flask[publisher server <div> <b> python3, flask ];
      rabbitMQ[job queue <div> <b> rabbitMQ];
      worker[HRNet model <div> <b> python3, pytorch];

      server-->|store and \n retrieve data| db;
      server -->|start inference and\n get results|flask
      -->|push tasks\n and pop results|rabbitMQ    
      worker -->|receive tasks| rabbitMQ
      
      end
```
Il diagramma rappresenta i servizi docker che compongono l'applicazione e le interazioni tra di essi. I nodi corrispondono a *container docker* orchestrati con l'utilizzo di *docker compose*. 

L'utente richiama le API esposte dal *backend node.js*. L'interazione B2B (*backend to backend*) avviene tra il server in *node.js* e un server in *flask* che si occupa di inviare richieste di inferenza al modello *pytorch* di HRNet tramite il framework *celery* che si interfaccia con una coda *rabbitMQ*.

### Diagramma dei casi d'uso
Il diagramma sottostante rappresenta il diagramma dei casi d'uso, cioè delle funzionalità disponibili agli utenti.
![progpa-Use case (2)](https://github.com/Vito-Scaraggi/PoseEstimator/assets/75072255/c4240c8a-bd45-425a-8dd0-b33dc3897202)

### Schema database 
![progpa-Class-Diagram](https://github.com/Vito-Scaraggi/PoseEstimator/assets/75072255/3028b687-b4c9-430f-a14d-9abbb96572f3)

### Pattern architetturale
Il pattern architetturale scelto per il design dell'API è una variante del MVVM (*Model-View-ViewModel*), privato della componente *View* al fine realizzare un *backend* puro. L'MVVM prevede di incapsulare la *business logic* all'interno del *ViewModel*, mentre il *Model* costituisce soltanto il modello dei dati. L'applicazione implementa un *ViewModel* (*alias* Controller) per ogni funzionalità individuata in fase di progettazione e un *Model*, creato con il *framework* [Sequelize](https://sequelize.org/), per ogni tabella presente all'interno del database.

```mermaid
  flowchart TD;
      ModelController;
      UserController;
      InferenceController;
      DatasetController;
      UserModel;
      ImageModel;
      ModelModel;
      UserModel;
      UserController -.use.-> UserModel;
      InferenceController -.use.-> UserModel;
      DatasetController -.use.-> UserModel;
      InferenceController -.use.-> ImageModel;
      DatasetController -.use.-> ImageModel;
      DatasetController -.use.-> DatasetModel;
      ModelController -.use.-> ModelModel;
      InferenceController -.use.-> ModelModel;
```

### Design pattern

#### Middleware / Builder
Il framework [Express.js](https://expressjs.com/) supporta nativamente il pattern *middleware*. Le richieste all'API vengono gestite da una serie di funzioni *middleware*, ognuna delle quali ha accesso agli oggetti *req* (Request), *res* (Response) e alla funzione *next* (NextFunction) che permette di invocare il *middleware* successivo.

Nel progetto si utilizzano il *middleware application-level* di terze parti *body-parser* e alcuni *middleware router-level custom*. Per lo sviluppo dei *middleware router-level* è stato adottato il *pattern Builder*. La classe *MiddlewareBuilder* facilita la costruzione di catene di *middleware functions* personalizzate evitando variabili *hard-coded* e codice duplicato. I metodi *"add"* aggiungono all'array *middlewares* la funzione corrispondente definita nella classe *Middleware*; il metodo *copy* effettua una *deep copy* dell'oggetto *MiddlewareBuilder* rendendolo riutilizzabile per rotte che condividono in tutto o in parte le funzioni di *middleware*. Il metodo *build* appende all'array *middlewares* la funzione del *controller* da richiamare e, se non specificato diversamente, il *middleware* per la gestione degli errori.

```mermaid

classDiagram
class Middleware{
-static secret : Buffer
+static checkAuth()
+static checkDatasetOwner()
+static checkAdmin()
+static errorHandler()
+static getUpload()
}
direction LR
class MiddlewareBuilder{
  -middlewares : function[]
  + copy() MiddlewareBuilder
  + addAuth() MiddlewareBuilder
  + addDatasetOwnership() MiddlewareBuilder
  + addAdmin() MiddlewareBuilder
  + addErrorHandler() MiddlewareBuilder
  + addUploader() MiddlewareBuilder
  + addUploaderZip() MiddlewareBuilder
  + build(controllerFun,err = true) function[]
}

MiddlewareBuilder ..> Middleware
```

I *middleware* previsti sono:
- checkAuth(): effettua l'autenticazione degli utenti
- checkDatasetOwner(): controlla che l'utente sia il proprietario del *dataset* specificato
- checkAdmin(): controlla che l'utente sia *admin*
- errorHandler(): gestisce le eccezioni e invia la risposta di errore
- getUpload(): gestisce l'upload di immagini o zip

#### Proxy / Singleton

L'inferenza sulle immagini deve essere effettuata soltanto dopo la validazione dei dati della richiesta e, in generale, l'accesso al modello HRNet, essendo una risorsa condivisa e computazionalmente onerosa, dev'essere controllato. Per questi motivi si è scelto di utilizzare il pattern *Proxy* per effettuare le chiamate alle API flask. Il metodo *inference()* esegue una chiamata POST al server flask per avviare l'inferenza soltanto se il *dataset* non è vuoto. 

Il *proxy* effettua anche il *caching* dei risultati dei *job*: infatti il metodo *status()* esegue una chiamata GET al server *flask* per conoscere lo stato di un *job* soltanto se non è presente nella *jobsCache* con assegnato uno degli stati finali.

Inoltre l'istanza dell'oggetto *proxy* è *singleton*.


```mermaid

classDiagram
class SingletonProxy{
-baseURL : string
-jobsCache : object
-static instance : SingletonProxy
-static FINAL_STATES : string[]
+getInstance() SingletonProxy
+inference()
+status()
}

```
#### Factory
La gestione degli errori è completamente demandata al *middleware errorHandler()* che, in base all'eccezione catturata, si occupa di rispondere con lo *status code* e il messaggio corretti. Per mappare le eccezioni al tipo di risposta è stato impiegato il *pattern Factory*. 

*Response Factory* crea oggetti di classe *Response* attraverso i metodi *getErrResponse()*, nel caso di errori, e *getSuccessResponse()* nel caso di successo. In particolare *getErrResponse()* restituisce un oggetto *Response* *custom* in base al nome della classe dell'eccezione lanciata, richiamando il metodo *getStatus()* che effettua una ricerca sul dizionario *statusToErrors*; *parseZod()* è un metodo di utilità che converte i messaggi delle eccezioni *ZodError* in validazione.

```mermaid

classDiagram
class Response{
+status : StatusCodes
+message : string
+constructor(status, message) Response
}
direction LR
class ResponseFactory{
  -static statusToErrors
  +static getStatus(errName) StatusCodes
  +static parseZod(message) object
  +static getErrResponse(error) Response
  +static getSuccessResponse(message, status) Response
}

ResponseFactory ..> Response
```
#### Altri pattern
Nell'implementazione sono stati utilizzati anche il pattern *DAO*, reso disponibile da *Sequelize*, il pattern *wrapper*, utile ad incapsulare il codice *pytorch* necessario per l'inferenza all'interno di una funzione *python* che ne "decora" il comportamento, e il pattern *publish/subscribe*, implementato con *celery* e *rabbitMQ*.

### Diagrammi di sequenza

Sequence diagram per la creazione di un dataset
```mermaid

sequenceDiagram
autonumber
actor User
participant M as Middleware
participant C as Dataset Controller
participant P as Postgres

User ->> M: POST /dataset
activate M
alt Error 401
M -->> User: Unauthorized
else Error 403
M -->> User: Forbidden
end
M ->> C: Request
activate C

C -->> M: Throw exception
M-->> User: 400 - Bad request
C ->> P: Create Dataset
activate P

alt 201 Created
P -->> C: Return Dataset
C -->> M: Return Dataset
M -->> User: Return Dataset Info
else Error 500
P -->> C: Database Error
deactivate P
C -->> M: Throw exception
deactivate C
M -->> User: Internal Server Error
deactivate M
end
```

Sequence diagram per l'inserimento di un file zip in un dataset
```mermaid

sequenceDiagram
autonumber
actor User
participant M as Middleware
participant C as Dataset Controller
participant P as Postgres

User ->> M: POST /dataset/:datasetId/zip
activate M
alt Error 401
M -->> User:  Unauthorized 
else Error 403
M -->> User: Forbidden
else Error 404
M -->> User: Not Found 
end

M ->> C: Request
activate C

C -->> M: Throw exception
alt Error 400
    M-->> User: Bad request
  else Error 404
   
   M-->> User: File Not Found
  end


C ->> C: Decompress Zip

loop Every image

  C ->> P: Create Image
  activate P
  alt is fine
    P -->> C: Return Image
  else Error
    P -->> C: Database error
  end
  deactivate P
end

alt 201 Created
    C -->> M: Return Image
    M -->> User: Return Upload Info
else Error 500
   C -->> M: Throw exception
   deactivate C
   M -->> User: Internal Server Error
end
deactivate M
```

Sequence diagram per il login di un utente
```mermaid

sequenceDiagram
autonumber
actor User
participant M as Middleware
participant C as User Controller
participant P as Postgres

User ->> M: POST /user/login
activate M
M ->> C: login
activate C
C ->> P: Get user
activate P
alt is fine
P -->> C: Return User
else Error
P -->> C: Database error
deactivate P
end
C ->> C: Authenticate User
alt 200 OK
C -->> M: Return JWT Token
M -->> User: Return JWT Token
else Error 401
C -->> M: Throw exception
deactivate C
M -->> User: Unauthorized
deactivate M
end
```

Sequence diagram per recuperare lo stato di un job
```mermaid

sequenceDiagram
autonumber
actor U as User<br><br>
participant M as Middleware
participant C as Inference Controller
participant PR as Proxy
participant F as flask publisher
participant Q as rabbitMQ

activate U
activate M
U ->> M: GET /status/:jobId
M ->> M: checkAuth
break auth failed
M -->> M : throw exception
M -->> U: 401 Unauthorized
end
activate C
M ->> C: getStatus
activate PR
C ->> PR: status
alt job cached with final state
PR -->> C : return cached job status
else job not cached with final state
activate F
PR ->> F : GET publisher:PORT/status/jobId
activate Q
F ->> Q : retrieve job status from queue
Q -->> F : return job status or error
deactivate Q
F -->> PR : return job status or error
deactivate F
PR -->> C : return job status
deactivate PR
end
break exception occurred
C -->> M : throw or propagate exception
deactivate C
M -->> U : error HTTP response
end
M -->> U : return job status
deactivate M
deactivate U
```

Sequence diagram per avviare l'inferenza su un dataset
```mermaid

sequenceDiagram
autonumber
actor U as User<br><br>
participant M as Middleware
participant C as Inference Controller
participant P as Postgres
participant PR as Proxy
participant F as flask publisher
participant Q as rabbitMQ
participant W as HRNet worker

activate U
activate M
U ->> M: GET /status/:jobId
M ->> M: checkAuth
break auth failed
M -->> M : throw exception
M -->> U: 401 Unauthorized
end
M ->> M: checkDatasetOwner
break dataset error
M -->> M : throw exception
M -->> U: error HTTP response
end
activate C
M ->> C: startInference
activate P
C ->> P : retrieve model name
P -->> C : return model name
C ->> P: retrieve dataset images info
P -->> C: return dataset images info
deactivate P
C ->> C : define request params and body
activate PR
C ->> PR: inference
alt dataset is void
PR -->> C : throw exception
else dataset contains at least one image
activate F
PR ->> F : POST publisher:PORT/model/:model/inference/:dataset
activate Q
F ->> Q : send task
activate W
Q ->> W : notify task
W -->> Q : ack
W ->> W : do inference
Q -->> F : return job id and state or error
deactivate Q
F -->> PR : return job id and state or error
deactivate F
PR -->> C : return job id and state
deactivate PR
end
alt task was not sent in ABORTED mode
  C --> C : bill user
end
break exception occurred
C -->> M : throw or propagate exception
deactivate C
M -->> U : error HTTP response
end
M -->> U : return job status
deactivate M
deactivate U
deactivate W
```

Sequence diagram per ricaricare il credito di un utente

```mermaid

sequenceDiagram
autonumber
actor U as User<br><br>
participant M as Middleware
participant C as User Controller
participant P as Postgres

activate U
activate M
U ->> M: POST /user/recharge
M ->> M: checkAuth
break auth failed
M -->> M : throw exception
M -->> U: 401 Unauthorized
end
M ->> M: checkAdmin
break not admin
M -->> M : throw exception
M -->> U: 403 Forbidden
end
activate C
M ->> C: rechargeByEmail
activate P
C ->> P: check if user with given email exists
P -->> C: return user
C ->> P: update user credits
P -->> C: query done
deactivate P
C -->> M: return success message
break exception occurred
C -->> M : throw or propagate exception
deactivate C
M -->> U : error HTTP response
end
M -->> U : return success message
deactivate M
deactivate U
```

## API
Le rotte con il simbolo :key: sono autenticate e necessitano di un header *authorization* contenente il *jwt token*.
### Get all Datasets :key:
Route:
```
GET /dataset/all
```
Response:
```json
[
    {
        "id": 1,
        "name": "dataset 1",
        "tags": [
            "tag1",
            "tag2"
        ],
        "format": "png",
        "userID": 1,
        "createdAt": "2023-07-16T15:15:23.324Z",
        "updatedAt": "2023-07-16T15:15:23.324Z"
    },
    {
        "id": 2,
        "name": "dataset 2",
        "tags": [],
        "format": "jpg",
        "userID": 1,
        "createdAt": "2023-07-16T15:22:31.855Z",
        "updatedAt": "2023-07-16T15:22:31.855Z"
    }
]
```
### Get dataset by Id :key:
Route:
```
POST /dataset/:datasetId
```
Response:
```json
{
    "id": 1,
    "name": "dataset 1",
    "tags": [
        "tag1",
        "tag2"
    ],
    "format": "png",
    "userID": 1,
    "createdAt": "2023-07-16T15:15:23.324Z",
    "updatedAt": "2023-07-16T15:15:23.324Z"
}
```
### Create dataset :key:
Route:
```
POST /dataset
```
Body:
```json
{
    "name" : "dataset 1",
    "tags": ["tag1", "tag2"],
    "format": "png"
}
```
Response:
```json
{
    "id": 1,
    "name": "dataset 1",
    "tags": [
        "tag1",
        "tag2"
    ],
    "format": "png",
    "userID": 1,
    "updatedAt": "2023-07-16T15:15:23.324Z",
    "createdAt": "2023-07-16T15:15:23.324Z"
}
```

### Update dataset :key:
Route:
```
PUT /dataset/:datasetId
```
Body:
```json
{   
    "name": "dataset",
    "tags": ["tag1"],
    "format": "jpg"
}
```
Response:
```json
{
    "id": 1,
    "name": "dataset",
    "tags": [
        "tag1"
    ],
    "format": "jpg",
    "userID": 1,
    "createdAt": "2023-07-16T15:15:23.324Z",
    "updatedAt": "2023-07-16T15:59:54.124Z"
}
```

### Delete dataset by Id :key:
Route:
```
DELETE /dataset/:datasetId
```
Response:
```json
{
    "id": 3,
    "name": "dataset 3",
    "tags": [],
    "format": "png",
    "userID": 1,
    "createdAt": "2023-07-16T15:36:41.858Z",
    "updatedAt": "2023-07-16T15:36:41.858Z"
}
```

### Insert Image :key:
Route:
```
POST /dataset/:datasetId/img
```
Body:
```json
{
  "file": "image.png",
  "info": {
    "bbox": [220, 65, 200, 350]
  }
}

```
Response:
```json
{
    "image_uuid": "d02a4bb4-b07e-4b5c-aaa7-55fac501dcbf"
}
```

### Insert Zip :key:
Route:
```
POST /dataset/:datasetId/zip
```
Body:
```json
{
  "file": "images.zip",
  "info": [
    {
      "img":"1_8bit.png",
      "bbox":[200,65,180,350]
    },
    {
      "img":"21_8bit.png",
      "bbox":[190,70,180,350]
    },
    ]
}

```
Response:
```json
{
    "images_uuid": [
        "81bc0181-9dc4-4aa6-862a-08d403f6d435",
        "65e06b89-144a-420b-b405-0a779980e960"
    ],
    "number_invalid_images": 0,
    "invalid_images": []
}
```

### Get Model
Route:
```
GET /model
```
Response:
```json
[
    {
        "id": 1,
        "name": "multi_out_pose_hrnet",
        "createdAt": null,
        "updatedAt": null
    }
]
```

### Get All Users
Route:
```
GET /user/all
```
Response:
```json
[
    {
        "id": 2,
        "name": "Luca",
        "surname": "Guidi",
        "email": "luca@luca.it",
        "credit": "100.00",
        "admin": false,
        "createdAt": null,
        "updatedAt": null
    },
    {
        "id": 3,
        "name": "Admin",
        "surname": "Admin",
        "email": "admin@admin.it",
        "credit": "200.00",
        "admin": true,
        "createdAt": null,
        "updatedAt": null
    },
    {
        "id": 1,
        "name": "Vito",
        "surname": "Scaraggi",
        "email": "vito@vito.it",
        "credit": "64.60",
        "admin": false,
        "createdAt": null,
        "updatedAt": "2023-07-17T08:47:23.153Z"
    }
]
```
### Login & Get Token
Route:
```
POST /login
```
Body:
```json
{
    "email" : "vito@vito.it",
    "password" : "vito"
}
```
Response:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjg5NTgzODQzLCJleHAiOjE2ODk2NzAyNDN9.guB247mGARDnKvQLgzWDXay-91P_YfOHQJkNaW1DBYs"
}
```
### Get User :key:
Route:
```
GET /user/:userId?
```
Response:
```json
{
    "id": 1,
    "name": "Vito",
    "surname": "Scaraggi",
    "email": "vito@vito.it",
    "password": "e220164f41888d58f385856cb6a245ff427544b65d00eb67360ad33f8b445506",
    "credit": "164.60",
    "admin": false,
    "createdAt": null,
    "updatedAt": "2023-07-17T09:00:51.662Z"
}
```
### Get User credit :key:
Route:
```
GET /user/credit/userId?
```
Response:
```json
{
    "credit": "164.60"
}
```
### Create User
Route:
```
POST /user
```
Body:
```json
{
    "name" : "Mario",
    "surname" : "Rossi",
    "email" : "mario@rossi.it",
    "password" : "mariorossi"
}
```
Response:
```json
{
    "credit": "100.00",
    "admin": false,
    "id": 4,
    "name": "Mario",
    "surname": "Rossi",
    "email": "mario@rossi.it",
    "password": "5032db4f275ea2034d4a0c3c09ca307ca83a379920c63b07c607951d378d7b8b",
    "updatedAt": "2023-07-17T08:52:02.432Z",
    "createdAt": "2023-07-17T08:52:02.432Z"
}
```
### Update User :key:
Route:
```
PUT /user/:userId?
```
Body:
```json
{
    "name" : "Marko",
    "surname" : "Red",
    "email" : "marko@red.it",
    "password" : "markored"
}
```
Response:
```json
{
    "id": 4,
    "name": "Marko",
    "surname": "Red",
    "email": "marko@red.it",
    "password": "ca3feef024d8c2ab3113ad5a2795e3194d8d4673ddf289dde6b4f23287f0f57f",
    "credit": "100.00",
    "admin": false,
    "createdAt": "2023-07-17T08:52:02.432Z",
    "updatedAt": "2023-07-17T08:58:03.030Z"
}
```
### Delete User :key:
Route:
```
DELETE /user/:userId?
```
Response:
```json
{
    "id": 4,
    "name": "Marko",
    "surname": "Red",
    "email": "marko@red.it",
    "password": "ca3feef024d8c2ab3113ad5a2795e3194d8d4673ddf289dde6b4f23287f0f57f",
    "credit": "100.00",
    "admin": false,
    "createdAt": "2023-07-17T08:52:02.432Z",
    "updatedAt": "2023-07-17T08:58:03.030Z"
}
```
### Recharge User by Email :key: (admin only)
Route:
```
POST /user/recharge
```
Body:
```json
{
    "email" : "vito@vito.it",
    "credit" : 100
}
```
Response:
```json
{
    "message": "recharge of 100 credits for vito@vito.it executed successfully"
}
```
### Start Inference :key:
Route:
```
GET /model/:modelId/inference/:datasetId
```
Response:
```json
{
    "id": "d465bd02-ebc5-4dd2-b38d-2e4d8cdd70ea",
    "status": "PENDING"
}
```
### Get Job Status :key:
Route:
```
GET /status/:jobId
```
Response:
```json
{
    "id": "d465bd02-ebc5-4dd2-b38d-2e4d8cdd70ea",
    "result": [
        {
            "image_id": 68,
            "keypoints": [
                {
                    "type": "right hand",
                    "x": 424,
                    "y": 368
                },
                {
                    "type": "right elbow",
                    "x": 205,
                    "y": 193
                },
                {
                    "type": "right shoulder",
                    "x": 215,
                    "y": 139
                },
                {
                    "type": "left shoulder",
                    "x": 383,
                    "y": 269
                },
                {
                    "type": "left elbow",
                    "x": 434,
                    "y": 395
                },
                {
                    "type": "left hand",
                    "x": 420,
                    "y": 375
                },
                {
                    "type": "right foot",
                    "x": 318,
                    "y": 125
                },
                {
                    "type": "right knee",
                    "x": 376,
                    "y": 395
                },
                {
                    "type": "right hip",
                    "x": 270,
                    "y": 142
                },
                {
                    "type": "left hip",
                    "x": 212,
                    "y": 248
                },
                {
                    "type": "left knee",
                    "x": 379,
                    "y": 398
                },
                {
                    "type": "left foot",
                    "x": 219,
                    "y": 180
                }
            ],
            "score": 35.34
        }
    ],
    "status": "COMPLETED"
}
```

## Quick start
Per utilizzare l'applicazione segui i seguenti step:

1. Installa *docker* e *docker compose*
2. Clona il repository
3. Scarica da [Model download](https://mega.nz/file/RmhF1KrK#_UfUSyS0S9oWF6dQnQUetbREhEad5JGIR3e3CVF5lnI) il modello con estensione .pth e posizionalo nella cartella di progetto nel modo seguente:

```
.
├── HRNet-Human-Pose-Estimation
│   ├── models
│   │   └── multi_out_pose_hrnet.pth
│   ├── ...
├── LICENSE
├── README.md
├── docker-compose.yml
├── publisher
└── server

```

4. Nella *root* di progetto esegui da terminale il comando:
```
  docker compose up
```

> **Tip**:bulb:: Scarica da [Dataset download](https://mega.nz/file/Ii4AhTIA#Vl6hkcguHW2ZAvgotDtCdrZYt30ZROkjn6LciSdpDY8) alcune immagini di test con annotazione appartenenti al [BabyposeDataset](https://link.springer.com/article/10.1007/s11517-022-02696-9). Puoi utilizzarle per effettuare l'inferenza inserendo opzionalmente il bounding box annotato.

## Testing

### Development stack

[![My Skills](https://skillicons.dev/icons?i=ts,expressjs,nodejs,sequelize,python,flask,pytorch,rabbitmq,postgres,docker,postman,vscode,github)](https://skillicons.dev)

### Contributors

[Vito Scaraggi](https://github.com/Vito-Scaraggi) & [Luca Guidi](https://github.com/LucaGuidi5)
