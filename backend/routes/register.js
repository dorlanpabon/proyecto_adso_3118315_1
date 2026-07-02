var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/connection');

/* POST register a new user. */
router.post('/', async function (req, res, next) {
  const { username, password, email, fullname, role } = req.body;

  if (!username || !password || !email || !fullname) {
    return res.status(400).json({ 
      message: 'Todos los campos (usuario, contraseña, email, nombre completo) son obligatorios.' 
    });
  }

  // Validar el rol (por defecto es 'aprendiz')
  const assignedRole = role || 'aprendiz';
  if (!['coordinador', 'instructor', 'aprendiz'].includes(assignedRole)) {
    return res.status(400).json({ message: 'El rol especificado es inválido.' });
  }

  try {
    // Verificar si el usuario o email ya están registrados
    const [existing] = await pool.query(
      'SELECT * FROM user WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (existing.length > 0) {
      const isEmail = existing.some(u => u.email === email);
      return res.status(400).json({ 
        message: isEmail ? 'El correo electrónico ya está registrado.' : 'El nombre de usuario ya está en uso.' 
      });
    }

    // Hashear la contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar el nuevo usuario en la base de datos
    await pool.query(
      'INSERT INTO user (username, password, email, fullname, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, fullname, assignedRole]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario en el servidor.' });
  }
});

module.exports = router;
