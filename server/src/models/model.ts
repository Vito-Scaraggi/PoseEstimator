import Sequelize from "sequelize"
import sequelize from "../utils/database"

// sequelize Model model definition
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

export default Model