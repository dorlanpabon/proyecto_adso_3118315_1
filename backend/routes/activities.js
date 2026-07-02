var express = require('express');
var router = express.Router();
const pool = require('../db/connection');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// 1. GET activities for a specific course (Protected - accessible to any authenticated user)
router.get('/course/:courseId', verifyToken, async function (req, res, next) {
  const { courseId } = req.params;

  try {
    // Si no es coordinador, verificar que el usuario pertenece a este curso
    if (req.user.role !== 'coordinador') {
      const [assigned] = await pool.query(
        'SELECT * FROM course_assignment WHERE user_id = ? AND course_id = ?', 
        [req.user.id, courseId]
      );
      if (assigned.length === 0) {
        return res.status(403).json({ message: 'No estás asignado a este curso para ver sus actividades.' });
      }
    }

    const [rows] = await pool.query(
      `SELECT a.*, u.fullname as creator_name 
       FROM activity a 
       INNER JOIN user u ON a.created_by = u.id 
       WHERE a.course_id = ? 
       ORDER BY a.due_date ASC`,
      [courseId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las actividades en el servidor.' });
  }
});

// 2. POST create a new activity (Protected - instructor only)
router.post('/', verifyToken, authorizeRoles('instructor'), async function (req, res, next) {
  const { title, description, due_date, course_id } = req.body;

  if (!title || !description || !due_date || !course_id) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar que el instructor está asignado a este curso
    const [assigned] = await pool.query(
      'SELECT * FROM course_assignment WHERE user_id = ? AND course_id = ?', 
      [req.user.id, course_id]
    );
    if (assigned.length === 0) {
      return res.status(403).json({ message: 'No tienes permiso para crear actividades en un curso al que no estás asignado.' });
    }

    await pool.query(
      'INSERT INTO activity (title, description, due_date, course_id, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, description, due_date, course_id, req.user.id]
    );

    res.status(201).json({ message: 'Actividad creada exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la actividad en el servidor.' });
  }
});

// 3. PUT update an activity (Protected - instructor only)
router.put('/:id', verifyToken, authorizeRoles('instructor'), async function (req, res, next) {
  const { id } = req.params;
  const { title, description, due_date } = req.body;

  if (!title || !description || !due_date) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar que la actividad existe y fue creada por este instructor
    const [activityRows] = await pool.query('SELECT * FROM activity WHERE id = ?', [id]);
    if (activityRows.length === 0) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    if (activityRows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'No estás autorizado para modificar una actividad creada por otro instructor.' });
    }

    await pool.query(
      'UPDATE activity SET title = ?, description = ?, due_date = ? WHERE id = ?',
      [title, description, due_date, id]
    );

    res.json({ message: 'Actividad actualizada exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la actividad en el servidor.' });
  }
});

// 4. DELETE an activity (Protected - instructor only)
router.delete('/:id', verifyToken, authorizeRoles('instructor'), async function (req, res, next) {
  const { id } = req.params;

  try {
    // Verificar que la actividad existe y fue creada por este instructor
    const [activityRows] = await pool.query('SELECT * FROM activity WHERE id = ?', [id]);
    if (activityRows.length === 0) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    if (activityRows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'No estás autorizado para eliminar una actividad creada por otro instructor.' });
    }

    await pool.query('DELETE FROM activity WHERE id = ?', [id]);
    res.json({ message: 'Actividad eliminada exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la actividad en el servidor.' });
  }
});

module.exports = router;
