import Sequelize from "sequelize"
import sequelize from "../utils/database"

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
    credit: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0 //process.env.CREDITS || 5000
    },
    admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    freezeTableName: true 
});

// Esportazione del modello User per l'uso in altri moduli
export default User;