var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
const cors = require('cors')

// const PORT = '8080'

var indexRouter = require('./routes/index')
var clientsRouter = require('./routes/clientRoutes')
var counsellorsRouter = require('./routes/counsellorRoutes')
var adminsRouter = require('./routes/adminRoutes')
const { currentUser } = require('./controllers/clientController')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

/* This code is enabling Cross-Origin Resource Sharing (CORS) for the Express app. It allows requests
from a different domain (in this case, 'http://localhost:3000') to access the resources of the
server. The `credentials: true` option allows cookies to be sent with the requests. */

app.use(
  cors({
    origin: 'https://harmony-hub-counselling.zahinzul.com',
    credentials: true,
  })
)

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/index', indexRouter)
app.use('/client', clientsRouter)
app.use('/counsellor', counsellorsRouter)
app.use('/admin', adminsRouter)

app.get('/', function checkStatus(req, res) {
  res.status(200).json({ status: 'ok' })
})

app.get('/api/current_user', currentUser)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

// app.listen(PORT, function () {
//   console.log(`App listening on port ${PORT}`)
// })

module.exports = app
