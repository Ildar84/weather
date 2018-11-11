var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fetch = require('node-fetch');
var { MongoClient } = require('mongodb');
var mongoose = require('mongoose');
var Agenda = require('agenda');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
if (process.env.NODE_ENV !== 'production'){
  require('dotenv').load();
}
const db_connection_string = process.env.DB_STRING;
var app = express();
// view engine setup;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

mongoose.connect(db_connection_string, {useNewUrlParser: true});
const db = mongoose.connection;

db.on('error', console.log.bind(console, 'connection error: '));

db.once('open', function callback(){
	console.log('The DataBase connected succesfully!');
});

require('./agendaJobs')();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
