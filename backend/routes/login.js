var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

/* POST login listing. */
router.post('/', async function (req, res, next) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'El usuario y la contraseña son obligatorios.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    const user = rows[0];
    
    // Comparación con bcrypt
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      isMatch = false;
    }

    // Fallback de retrocompatibilidad: comparación en texto plano
    if (!isMatch && password === user.password) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        fullname: user.fullname, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'super_secret_key_adso_3118315',
      { expiresIn: '2h' }
    );

    // Responder con el token y datos del usuario
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
