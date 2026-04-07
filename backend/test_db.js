const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
    try {
        console.log('Connecting with:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'blood_donation',
            port: process.env.DB_PORT || 3306
        });
        
        console.log('Connected to MySQL!');
        
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
        
        const [hospitals] = await connection.execute('DESCRIBE hospitals');
        console.log('Hospitals structure:', hospitals);
        
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

checkDB();
