import oracledb from 'oracledb';

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    privilege: oracledb.SYSDBA,
};

export async function getConnection(): Promise<oracledb.Connection> {
    try {
        const connection = await oracledb.getConnection(dbConfig);
        return connection;
    } catch (err) {
        console.error('Error acquiring Oracle DB connection:', err.message);
        throw err;
    }
}
