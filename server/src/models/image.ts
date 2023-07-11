import Sequelize from "sequelize"
import sequelize from "../utils/database"

// Definizione del modello Dataset
const Image = sequelize.define("image", {
    uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    file_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
    },
    bbox: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: [200,250,250,300],
        allowNull: false
    },
    datasetID: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
},{
    freezeTableName: true 
});


// Esportazione del modello Dataset per l'uso in altri moduli
export default Image