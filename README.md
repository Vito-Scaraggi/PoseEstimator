# PoseEstimator
**PoseEstimator** è un back-end in [Node.js](https://nodejs.org/en) che permette di fare inferenza su immagini utilizzando la rete neurale [HRNet](https://github.com/Vito-Scaraggi/HRNet-Human-Pose-Estimation) per il *task* di stima della posa.

## Obiettivo del progetto
## Progettazione
### Architettura dei servizi docker
```mermaid
  flowchart LR;
      
      server[<div>backend</div> <svg width=40 height=40><image width=40 height=40 xlink:href='https://skillicons.dev/icons?i=nodejs'/></svg>];

      db[(<div>Postgres</div> <svg width=40 height=40><image width=40 height=40 xlink:href='https://skillicons.dev/icons?i=postgres'/></svg>)];

      flask[<div>publisher</div> <svg width=40 height=40><image width=40 height=40 xlink:href='https://skillicons.dev/icons?i=flask'/></svg>];

      rabbitMQ[<div>job queue</div> <svg width=40 height=40><image width=40 height=40 xlink:href='https://skillicons.dev/icons?i=rabbitmq'/></svg>];
      
      worker[<div>HRNet model</div> <svg width=40 height=40><image width=40 height=40 xlink:href='https://skillicons.dev/icons?i=pytorch'/></svg>];

      server--> db;
      server --> flask-->rabbitMQ--> worker
```

### Pattern
### Diagrammi UML

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

## API
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

4. Nella *root* di progetto esegui da terminale:
```
  docker compose up
```

> **Tip**:bulb:: Scarica da [Dataset download](https://mega.nz/file/Ii4AhTIA#Vl6hkcguHW2ZAvgotDtCdrZYt30ZROkjn6LciSdpDY8) alcune immagini di test con annotazione appartenenti al [BabyposeDataset](https://link.springer.com/article/10.1007/s11517-022-02696-9). Puoi utilizzarle per effettuare l'inferenza inserendo opzionalmente il bounding box annotato.

## Testing

#### Contributors

[Vito Scaraggi](https://github.com/Vito-Scaraggi) & [Luca Guidi](https://github.com/LucaGuidi5)