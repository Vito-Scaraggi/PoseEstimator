import Sequelize from "sequelize"
import sequelize from "../utils/database"

// sequelize User model definition
const User = sequelize.define("user", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    surname: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    email: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
    },
    password: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    salt : {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    credit: {
        type: Sequelize.DECIMAL(11,2),
        allowNull: false,
        defaultValue: process.env.DEFAULT_CREDITS || 500
    },
    admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    freezeTableName: true 
});

export default User;