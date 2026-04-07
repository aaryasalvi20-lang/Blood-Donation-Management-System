const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function testRegistration() {
    try {
        const db = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'blood_donation',
            port: process.env.DB_PORT || 3306
        });
        
        const name = "Test Hospital";
        const email = "test@hospital.com";
        const password = "password123";
        const location = "Test City";
        
        console.log('Testing registration for:', email);
        
        // Check if exists
        const [existing] = await db.execute('SELECT email FROM hospitals WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('Email already exists, deleting it to re-test...');
            await db.execute('DELETE FROM hospitals WHERE email = ?', [email]);
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            const [result] = await db.execute(
                'INSERT INTO hospitals (name, email, password, location) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, location]
            );
            console.log('Registration successful! InsertID:', result.insertId);
        } catch (insertErr) {
            console.error('INSERT FAILED:', insertErr);
        }
        
        await db.end();
        process.exit(0);
    } catch (err) {
        console.error('OUTER ERROR:', err);
        process.exit(1);
    }
}

testRegistration();
