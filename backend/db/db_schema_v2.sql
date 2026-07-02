-- 1. Tabla de Cursos / Fichas
CREATE TABLE IF NOT EXISTS course (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,       -- Ej. 'Ficha 3118315'
  name VARCHAR(150) NOT NULL,             -- Ej. 'Análisis y Desarrollo de Software'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla de Asignaciones (Relación Usuarios <-> Cursos)
CREATE TABLE IF NOT EXISTS course_assignment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_course (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla de Evidencias / Actividades creadas por Instructores
CREATE TABLE IF NOT EXISTS activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  due_date DATETIME NOT NULL,
  course_id INT NOT NULL,
  created_by INT NOT NULL,                -- ID del instructor que la creó
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla de Entregas de Evidencias por Aprendices
CREATE TABLE IF NOT EXISTS submission (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  apprentice_id INT NOT NULL,
  file_url VARCHAR(255) NOT NULL,          -- Simulación de enlace de archivo / drive / github
  comments TEXT,                           -- Comentarios del aprendiz al entregar
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade ENUM('Aprobado', 'Deficiente') DEFAULT NULL, -- Calificación SENA
  feedback TEXT,                           -- Retroalimentación del instructor
  graded_by INT DEFAULT NULL,              -- ID del instructor que calificó
  graded_at DATETIME DEFAULT NULL,
  FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE,
  FOREIGN KEY (apprentice_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES user(id) ON DELETE SET NULL,
  UNIQUE KEY unique_apprentice_activity (apprentice_id, activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar Cursos de prueba
INSERT INTO course (code, name) VALUES 
('3118315', 'Análisis y Desarrollo de Software (ADSO)'),
('2883492', 'Gestión de Redes y Telecomunicaciones')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Asignar el Instructor de prueba (id: 2) y Aprendiz de prueba (id: 3) al curso 1 (ADSO)
-- Nota: En base de datos limpia de schema.sql, 'instructor' tiene ID 2 y 'aprendiz' tiene ID 3.
-- Usaremos una subconsulta para encontrar los IDs de forma dinámica.
INSERT INTO course_assignment (user_id, course_id)
SELECT u.id, c.id 
FROM user u, course c 
WHERE u.username = 'instructor' AND c.code = '3118315'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO course_assignment (user_id, course_id)
SELECT u.id, c.id 
FROM user u, course c 
WHERE u.username = 'aprendiz' AND c.code = '3118315'
ON DUPLICATE KEY UPDATE user_id = user_id;
