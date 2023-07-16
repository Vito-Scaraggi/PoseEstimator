import Sequelize from "sequelize"
import sequelize from "../utils/database"

// sequelize Dataset model definition
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
        defaultValue: []
    },
    format: {
        type: Sequelize.TEXT,
        defaultValue: 'png'
    },
    userID: {
        type: Sequelize.INTEGER,
        allowNull: false,
    }
},{
    freezeTableName: true 
});

export default Dataset