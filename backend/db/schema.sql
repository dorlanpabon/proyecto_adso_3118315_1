-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS proyecto_adso_evidencias;
USE proyecto_adso_evidencias;

-- Crear la tabla 'user'
CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  fullname VARCHAR(100) NOT NULL,
  role ENUM('coordinador', 'instructor', 'aprendiz') NOT NULL DEFAULT 'aprendiz',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar datos de prueba (las contraseñas están hasheadas con bcrypt)
-- 'admin123' para el coordinador, 'instructor123' para el instructor, 'aprendiz123' para el aprendiz.
INSERT INTO user (username, password, email, fullname, role)
VALUES 
('admin', '$2b$10$je7BYjEcMYg1MFqGbIfuk.810ZRlbc//ISvI5mdW097GfqPlTQkva', 'coordinador@adso.edu.co', 'Juan Coordinador', 'coordinador'),
('instructor', '$2b$10$cHvWx.SX2s6t22vkKdoFH.SMBivzKmcfm/puVkqCybeZvqKd45F.2', 'instructor@adso.edu.co', 'Maria Instructora', 'instructor'),
('aprendiz', '$2b$10$CMoGJxwg/tawFXxZ/n0SAuSTyhFg1bLeYTZqVRdYgQPYhxIBAEK2K', 'aprendiz@adso.edu.co', 'Carlos Aprendiz', 'aprendiz')
ON DUPLICATE KEY UPDATE 
password = VALUES(password),
email = VALUES(email),
fullname = VALUES(fullname),
role = VALUES(role);
