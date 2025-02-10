import sql from 'mssql';
import {gerarCobranca} from './services/cobranca_recorrente_CPF.js'
import dotenv from 'dotenv'
import {gerarCobrancaCnpj} from "./services/cobranca_recorrente_CNPJ.js";
import {atualizacaoSituacao} from "./services/status.js";
import {bloqueioAutomatico} from "./services/bloqueioAutomatico.js";

dotenv.config();


const sqlConfig = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    pool: {
        max: 10,
        min: 0,
    },
    options: {
        encrypt: true,
        trustServerCertificate: true
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
    debug: true

}

let dbConnection = null;

async function db(){

    if (dbConnection) {
        return dbConnection;
    }

    try {
        const pool = new sql.ConnectionPool(sqlConfig);
        dbConnection = await pool.connect();
        console.log('Database connected successfully');
        return dbConnection;
    } catch (err) {
        console.error('Database connection failed', err);
        throw err;
    }
}

process.on('SIGINT', async () => {
    if (dbConnection) {
        try {
            await dbConnection.close();
            console.log('Database connection closed');
        } catch (err) {
            console.error('Error closing the database connection', err);
        }
    }
    process.exit();
});

const iniciandoCodigo = async () => {
    try {
        const connection = await db();
        await gerarCobranca(connection);
        await gerarCobrancaCnpj(connection)
        await atualizacaoSituacao(connection);
        await bloqueioAutomatico(connection);
    } catch (error) {
        console.error(error);
    }
};

iniciandoCodigo();

export default db;

