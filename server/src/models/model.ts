import Sequelize from "sequelize"
import sequelize from "../utils/database"

// Definizione del modello Model
const Model = sequelize.define("model", {
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
    }
},{
    freezeTableName: true 
});

// Esportazione del modello Model per l'uso in altri moduli
export default Model