require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function init() {
  const dbName = process.env.DB_NAME || 'proyecto_adso_evidencias';
  console.log(`Iniciando configuración de la base de datos: ${dbName}...`);

  // Configuración de la conexión inicial al servidor MySQL
  const connConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  // Habilitar SSL para conexiones a la nube (como Aiven)
  if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' || connConfig.port !== 3306) {
    connConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  const connection = await mysql.createConnection(connConfig);

  try {
    // 1. Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Base de datos '${dbName}' creada o ya existente.`);

    // 2. Seleccionar la base de datos
    await connection.query(`USE \`${dbName}\`;`);

    // 3. Leer y ejecutar el archivo schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Quitar comentarios SQL simples y multilínea para evitar fallos de parser
    schemaSql = schemaSql
      .replace(/\/\*[\s\S]*?\*\//g, '') // comentarios /* ... */
      .replace(/--.*$/gm, '');          // comentarios -- ...

    // Separar las sentencias por punto y coma (;) asegurando que no rompa cadenas de texto
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Ejecutando ${statements.length} sentencias SQL...`);

    for (const statement of statements) {
      // Ignorar si es vacía
      if (!statement) continue;
      
      // Si la sentencia intenta crear otra base de datos o usarla, la ignoramos o adaptamos
      if (statement.toUpperCase().startsWith('CREATE DATABASE') || statement.toUpperCase().startsWith('USE')) {
        continue;
      }
      
      await connection.query(statement);
    }

    console.log('¡Base de datos e información semilla configuradas exitosamente!');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

init();
