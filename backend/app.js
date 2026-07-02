require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const coursesRouter = require('./routes/courses');
const activitiesRouter = require('./routes/activities');
const submissionsRouter = require('./routes/submissions');

var app = express();

// Configuración avanzada de CORS para permitir cabeceras de autorización y el origen de Netlify / local
app.use(cors({
  origin: function (origin, callback) {
    // Permitir y reflejar dinámicamente cualquier origen para habilitar Netlify y localhost
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);
app.use('/api/register', registerRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/submissions', submissionsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
