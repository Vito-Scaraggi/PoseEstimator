import Sequelize from "sequelize"
import sequelize from "../utils/database"

// Definizione del modello Dataset
const Image = sequelize.define("image", {
    uuid: {
        type: Sequelize.TEXT,
        primaryKey: true,
        allowNull: false,
    },
    file_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
    },
    bbox: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false,
        defaultValue: 0
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