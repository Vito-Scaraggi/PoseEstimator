import Sequelize from "sequelize"
import sequelize from "../utils/database"

// sequelize Image model definition
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
        defaultValue: [220, 65, 200, 350],
        allowNull: false
    },
    datasetID: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
},{
    freezeTableName: true 
});

export default Image