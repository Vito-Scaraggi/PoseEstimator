import { Sequelize } from "sequelize"

// Creating sequelize instance for the connection to the databse
const sequelize = new Sequelize(
    process.env.POSTGRES_DB || "",  // Name of the databse
    process.env.POSTGRES_USER || "",      // Username for the database
    process.env.POSTGRES_PASSWORD || "",  // Password for the database
    {
        host: process.env.DB_HOST, // Host of the database
        dialect: "postgres",       // Using PostgreSQL Dialect
    }  
    
)

export default sequelize // Exporting sequelize instance