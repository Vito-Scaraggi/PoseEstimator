import express from 'express'
import DatasetsController from "../controllers/datasets"
import MWBuilder from '../middlewares/middleware';
import multer from 'multer';
import path  from "path";
import fs from 'fs-extra';

const DatasetsRouter = express.Router()


const checkFileType = function (file: any, cb: any) {
    //Estensioni permesse
    const fileTypes = /jpeg|jpg|png/;
    
    //check delle estensioni
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    
    const mimeType = fileTypes.test(file.mimetype);
    
    if (mimeType && extName) {
        return cb(null, true);
    } else {
        cb("Error: You can Only Upload Images!!");
    }
};

const storageEngine = multer.diskStorage({
    destination: (request, file, cb) => {
            cb(null, './images')
        },
    filename: (req, file, cb) => {
        cb(null, `tmp--${file.originalname}`);
    },
});

const upload = multer({
    storage: storageEngine,
    fileFilter: (req, file, cb) => {checkFileType(file, cb);},
});

DatasetsRouter
            .get("/dataset/all",  new MWBuilder().addAuth().addCustom( DatasetsController.getAll).build() )
            .get("/dataset/:datasetId",new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.getById).build())
            .post("/dataset", new MWBuilder().addAuth().addCustom( DatasetsController.create).build())
            .delete("/dataset/:datasetId", new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.delete).build())
            .put("/dataset/:datasetId", new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.updateById).build())
            .post("/dataset/:datasetId/img", upload.single('image'), new MWBuilder().addAuth().addDatasetOwnership().addCustom( DatasetsController.insertImg).build())


export default DatasetsRouter;