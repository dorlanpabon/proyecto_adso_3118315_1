var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/connection');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

/* GET all users listing (Protected - accessible to any authenticated user). */
router.get('/', verifyToken, async function (req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, username, email, fullname, role, created_at FROM user');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios.' });
  }
});

/* POST create a new user (Protected - coordinator only). */
router.post('/', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { username, password, email, fullname, role } = req.body;

  if (!username || !password || !email || !fullname || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  if (!['coordinador', 'instructor', 'aprendiz'].includes(role)) {
    return res.status(400).json({ message: 'El rol especificado es inválido.' });
  }

  try {
    // Verificar si el usuario o email ya existe
    const [existing] = await pool.query('SELECT * FROM user WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      const isEmail = existing.some(u => u.email === email);
      return res.status(400).json({ 
        message: isEmail ? 'El correo electrónico ya está registrado.' : 'El nombre de usuario ya está en uso.' 
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar en la DB
    await pool.query(
      'INSERT INTO user (username, password, email, fullname, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, fullname, role]
    );

    res.status(201).json({ message: 'Usuario creado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el usuario en el servidor.' });
  }
});

/* PUT update a user (Protected - coordinator only). */
router.put('/:id', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { id } = req.params;
  const { username, password, email, fullname, role } = req.body;

  if (!username || !email || !fullname || !role) {
    return res.status(400).json({ message: 'Todos los campos excepto la contraseña son obligatorios.' });
  }

  if (!['coordinador', 'instructor', 'aprendiz'].includes(role)) {
    return res.status(400).json({ message: 'El rol especificado es inválido.' });
  }

  try {
    // Verificar si el usuario existe
    const [userRows] = await pool.query('SELECT * FROM user WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar colisiones de username o email con otros registros
    const [existing] = await pool.query(
      'SELECT * FROM user WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );
    if (existing.length > 0) {
      const isEmail = existing.some(u => u.email === email);
      return res.status(400).json({ 
        message: isEmail ? 'El correo electrónico ya está registrado por otro usuario.' : 'El nombre de usuario ya está en uso.' 
      });
    }

    let queryStr = '';
    let queryParams = [];

    // Hashear e incluir contraseña solo si se proporciona
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      queryStr = 'UPDATE user SET username = ?, password = ?, email = ?, fullname = ?, role = ? WHERE id = ?';
      queryParams = [username, hashedPassword, email, fullname, role, id];
    } else {
      queryStr = 'UPDATE user SET username = ?, email = ?, fullname = ?, role = ? WHERE id = ?';
      queryParams = [username, email, fullname, role, id];
    }

    await pool.query(queryStr, queryParams);
    res.json({ message: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el usuario en el servidor.' });
  }
});

/* DELETE a user (Protected - coordinator only). */
router.delete('/:id', verifyToken, authorizeRoles('coordinador'), async function (req, res, next) {
  const { id } = req.params;

  try {
    // Verificar si el usuario existe
    const [userRows] = await pool.query('SELECT * FROM user WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Evitar que el usuario se elimine a sí mismo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario.' });
    }

    await pool.query('DELETE FROM user WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el usuario en el servidor.' });
  }
});

module.exports = router;
