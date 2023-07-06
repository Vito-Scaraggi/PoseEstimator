// Importazione del modulo Sequelize
import { Sequelize } from "sequelize"

// Creazione di un'istanza di Sequelize per la connessione al database
const sequelize = new Sequelize(
    process.env.PGDATABASE || "",  // Nome del database
    process.env.PGUSER || "",      // Nome utente del database
    process.env.PGPASSWORD || "",  // Password del database
    {
        host: process.env.DB_HOST, // Host del database
        dialect: "postgres",       // Utilizzo del dialetto PostgreSQL
    }  
    
)

export default sequelize // Esportazione dell'istanza di Sequelize per l'uso in altri moduli