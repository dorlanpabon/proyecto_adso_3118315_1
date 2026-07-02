var express = require('express');
var router = express.Router();
const pool = require('../db/connection');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// 1. GET courses assigned to the current user (Protected - accessible to any authenticated user)
router.get('/my-courses', verifyToken, async function (req, res, next) {
  try {
    // Los coordinadores pueden ver todos los cursos, instructores y aprendices ven solo sus asignaciones
    if (req.user.role === 'coordinador') {
      const [rows] = await pool.query('SELECT * FROM course ORDER BY code ASC');
      return res.json(rows);
    }

    const [rows] = await pool.query(
      `SELECT c.id, c.code, c.name, ca.assigned_at 
       FROM course c 
       INNER JOIN course_assignment ca ON c.id = ca.course_id 
       WHERE ca.user_id = ? 
       ORDER BY c.code ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tus cursos.' });
  }
});

// 2. GET list of all courses (Protected - accessible to coordinators or instructors)
router.get('/', verifyToken, authorizeRoles('coordinador', 'instructor'), async function (req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM course ORDER BY code ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los cursos.' });
  }
});

// 3. POST create a new course (Protected - coordinator only)
router.post('/', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { code, name } = req.body;

  if (!code || !name) {
    return res.status(400).json({ message: 'El código (ficha) y el nombre son obligatorios.' });
  }

  try {
    // Verificar si el código ya existe
    const [existing] = await pool.query('SELECT * FROM course WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya existe un curso registrado con esta ficha.' });
    }

    await pool.query('INSERT INTO course (code, name) VALUES (?, ?)', [code, name]);
    res.status(201).json({ message: 'Curso creado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el curso en el servidor.' });
  }
});

// 4. PUT update a course (Protected - coordinator only)
router.put('/:id', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { id } = req.params;
  const { code, name } = req.body;

  if (!code || !name) {
    return res.status(400).json({ message: 'El código (ficha) y el nombre son obligatorios.' });
  }

  try {
    const [courseRows] = await pool.query('SELECT * FROM course WHERE id = ?', [id]);
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado.' });
    }

    // Verificar colisión de código con otro curso
    const [existing] = await pool.query('SELECT * FROM course WHERE code = ? AND id != ?', [code, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya existe otra ficha registrada con este código.' });
    }

    await pool.query('UPDATE course SET code = ?, name = ? WHERE id = ?', [code, name, id]);
    res.json({ message: 'Curso actualizado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el curso en el servidor.' });
  }
});

// 5. DELETE a course (Protected - coordinator only)
router.delete('/:id', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { id } = req.params;

  try {
    const [courseRows] = await pool.query('SELECT * FROM course WHERE id = ?', [id]);
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado.' });
    }

    await pool.query('DELETE FROM course WHERE id = ?', [id]);
    res.json({ message: 'Curso eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el curso en el servidor.' });
  }
});

// 6. POST assign a user to a course (Protected - coordinator only)
router.post('/assign', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { user_id, course_id } = req.body;

  if (!user_id || !course_id) {
    return res.status(400).json({ message: 'El usuario y el curso son requeridos.' });
  }

  try {
    // Validar existencia de usuario y curso
    const [userRows] = await pool.query('SELECT id, role FROM user WHERE id = ?', [user_id]);
    const [courseRows] = await pool.query('SELECT id FROM course WHERE id = ?', [course_id]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado.' });
    }

    // Verificar si ya está asignado
    const [existing] = await pool.query(
      'SELECT * FROM course_assignment WHERE user_id = ? AND course_id = ?', 
      [user_id, course_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'El usuario ya está asignado a este curso.' });
    }

    await pool.query(
      'INSERT INTO course_assignment (user_id, course_id) VALUES (?, ?)', 
      [user_id, course_id]
    );
    res.status(201).json({ message: 'Usuario asignado exitosamente al curso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al asignar el usuario en el servidor.' });
  }
});

// 7. DELETE remove a user assignment (Protected - coordinator only)
router.delete('/assign', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { user_id, course_id } = req.body;

  if (!user_id || !course_id) {
    return res.status(400).json({ message: 'El usuario y el curso son requeridos.' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT * FROM course_assignment WHERE user_id = ? AND course_id = ?', 
      [user_id, course_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'La asignación no existe.' });
    }

    await pool.query(
      'DELETE FROM course_assignment WHERE user_id = ? AND course_id = ?', 
      [user_id, course_id]
    );
    res.json({ message: 'Asignación removida exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al remover la asignación en el servidor.' });
  }
});

// 8. GET members of a course (Protected - accessible to coordinators and instructors)
router.get('/:id/members', verifyToken, authorizeRoles('coordinador', 'instructor'), async function (req, res, next) {
  const { id } = req.params;

  try {
    const [courseRows] = await pool.query('SELECT * FROM course WHERE id = ?', [id]);
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado.' });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.fullname, u.role, ca.assigned_at
       FROM user u 
       INNER JOIN course_assignment ca ON u.id = ca.user_id 
       WHERE ca.course_id = ? 
       ORDER BY u.role ASC, u.fullname ASC`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los integrantes del curso.' });
  }
});

module.exports = router;
