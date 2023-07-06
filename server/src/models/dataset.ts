import Sequelize from "sequelize"
import sequelize from "../utils/database"

// Definizione del modello Dataset
const Dataset = sequelize.define("dataset", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
    },
    tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: 0
    },
    userID: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
},{
    freezeTableName: true 
});


// Esportazione del modello Dataset per l'uso in altri moduli
export default Dataset