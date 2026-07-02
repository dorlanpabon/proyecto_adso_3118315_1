var express = require('express');
var router = express.Router();
const pool = require('../db/connection');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// 1. GET submissions for a specific activity (Protected - instructor only)
router.get('/activity/:activityId', verifyToken, authorizeRoles('instructor'), async function (req, res, next) {
  const { activityId } = req.params;

  try {
    // Verificar que la actividad pertenece a un curso del instructor
    const [activityRows] = await pool.query(
      `SELECT a.course_id FROM activity a WHERE a.id = ?`, 
      [activityId]
    );
    if (activityRows.length === 0) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    const [assigned] = await pool.query(
      'SELECT * FROM course_assignment WHERE user_id = ? AND course_id = ?', 
      [req.user.id, activityRows[0].course_id]
    );
    if (assigned.length === 0) {
      return res.status(403).json({ message: 'No estás asignado al curso de esta actividad para evaluar entregas.' });
    }

    const [rows] = await pool.query(
      `SELECT s.*, u.fullname as apprentice_name, u.email as apprentice_email,
              ig.fullname as grader_name
       FROM submission s
       INNER JOIN user u ON s.apprentice_id = u.id
       LEFT JOIN user ig ON s.graded_by = ig.id
       WHERE s.activity_id = ?
       ORDER BY s.submitted_at DESC`,
      [activityId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las entregas en el servidor.' });
  }
});

// 2. GET current user's submissions (Protected - apprentice only)
router.get('/my-submissions', verifyToken, authorizeRoles('aprendiz'), async function (req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, a.title as activity_title, a.due_date as activity_due_date,
              c.name as course_name, c.code as course_code
       FROM submission s
       INNER JOIN activity a ON s.activity_id = a.id
       INNER JOIN course c ON a.course_id = c.id
       WHERE s.apprentice_id = ?
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tus entregas en el servidor.' });
  }
});

// 3. POST submit evidence (Protected - apprentice only)
router.post('/', verifyToken, authorizeRoles('aprendiz'), async function (req, res, next) {
  const { activity_id, file_url, comments } = req.body;

  if (!activity_id || !file_url) {
    return res.status(400).json({ message: 'La actividad y la URL del archivo son obligatorias.' });
  }

  try {
    // Validar que la actividad exista
    const [activityRows] = await pool.query('SELECT course_id FROM activity WHERE id = ?', [activity_id]);
    if (activityRows.length === 0) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    // Validar que el aprendiz esté asignado al curso de la actividad
    const [assigned] = await pool.query(
      'SELECT * FROM course_assignment WHERE user_id = ? AND course_id = ?', 
      [req.user.id, activityRows[0].course_id]
    );
    if (assigned.length === 0) {
      return res.status(403).json({ message: 'No estás asignado al curso de esta actividad para realizar una entrega.' });
    }

    // Comprobar si ya existe una entrega previa
    const [existing] = await pool.query(
      'SELECT id, grade FROM submission WHERE apprentice_id = ? AND activity_id = ?',
      [req.user.id, activity_id]
    );

    if (existing.length > 0) {
      // Si ya fue calificada y aprobada, opcionalmente impedir reenvío
      if (existing[0].grade === 'Aprobado') {
        return res.status(400).json({ message: 'Esta evidencia ya fue calificada como Aprobada y no requiere reenvío.' });
      }

      // Actualizar la entrega actual (Reenvío)
      await pool.query(
        `UPDATE submission 
         SET file_url = ?, comments = ?, submitted_at = CURRENT_TIMESTAMP, grade = NULL, feedback = NULL, graded_by = NULL, graded_at = NULL 
         WHERE id = ?`,
        [file_url, comments || null, existing[0].id]
      );
      return res.json({ message: 'Evidencia reenviada y actualizada con éxito.' });
    }

    // Crear nueva entrega
    await pool.query(
      'INSERT INTO submission (activity_id, apprentice_id, file_url, comments) VALUES (?, ?, ?, ?)',
      [activity_id, req.user.id, file_url, comments || null]
    );
    res.status(201).json({ message: 'Evidencia entregada con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al enviar la evidencia en el servidor.' });
  }
});

// 4. POST grade a submission (Protected - instructor only)
router.post('/:id/grade', verifyToken, authorizeRoles('instructor'), async function (req, res, next) {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  if (!grade) {
    return res.status(400).json({ message: 'La calificación (Aprobado o Deficiente) es requerida.' });
  }

  if (!['Aprobado', 'Deficiente'].includes(grade)) {
    return res.status(400).json({ message: 'Calificación inválida. Debe ser Aprobado o Deficiente.' });
  }

  try {
    // Obtener la entrega y validar su existencia
    const [submissionRows] = await pool.query(
      `SELECT s.*, a.course_id 
       FROM submission s 
       INNER JOIN activity a ON s.activity_id = a.id 
       WHERE s.id = ?`, 
      [id]
    );
    if (submissionRows.length === 0) {
      return res.status(404).json({ message: 'Entrega de evidencia no encontrada.' });
    }

    // Validar que el instructor calificador pertenezca al curso de esta entrega
    const [assigned] = await pool.query(
      'SELECT * FROM course_assignment WHERE user_id = ? AND course_id = ?', 
      [req.user.id, submissionRows[0].course_id]
    );
    if (assigned.length === 0) {
      return res.status(403).json({ message: 'No estás asignado al curso de esta entrega para calificarla.' });
    }

    // Guardar calificación y comentarios
    await pool.query(
      `UPDATE submission 
       SET grade = ?, feedback = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [grade, feedback || null, req.user.id, id]
    );

    res.json({ message: 'Calificación y retroalimentación guardadas con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al calificar la evidencia en el servidor.' });
  }
});

module.exports = router;
