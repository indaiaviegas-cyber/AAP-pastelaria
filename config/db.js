require('dotenv').config(); // Carrega as variáveis do arquivo .env
const mysql = require('mysql2');

const dbOperacional = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_OPERACIONAL
});

const dbUsuarios = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_USUARIOS
});

module.exports = { dbOperacional, dbUsuarios };