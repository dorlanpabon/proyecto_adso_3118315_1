require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const dbName = process.env.DB_NAME || 'proyecto_adso_evidencias';
  console.log(`Ejecutando migración de la Fase 2 en base de datos: ${dbName}...`);

  const connConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
  };

  // Habilitar SSL para bases de datos en la nube (como Aiven)
  if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' || connConfig.port !== 3306) {
    connConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  const connection = await mysql.createConnection(connConfig);

  try {
    const migrationPath = path.join(__dirname, 'db_schema_v2.sql');
    let migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Limpiar comentarios
    migrationSql = migrationSql
      .replace(/\/\*[\s\S]*?\*\//g, '') // comentarios /* ... */
      .replace(/--.*$/gm, '');          // comentarios -- ...

    // Separar por punto y coma
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Ejecutando ${statements.length} sentencias SQL de migración...`);

    for (const statement of statements) {
      if (!statement) continue;
      await connection.query(statement);
    }

    console.log('¡Migración de Fase 2 completada exitosamente!');
  } catch (error) {
    console.error('Error durante la migración de la Fase 2:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
