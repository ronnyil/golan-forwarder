var express = require('express')
var routes = require('./routes')
var path = require('path')

var app = express()

app.set('port', process.env.PORT || 3000)
app.set('views',path.join(__dirname,'views'))
app.set('view engine', 'jade')
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', routes.index)

var server = app.listen(3000,function() {
  console.log('Listening on port %d',server.address().port)
})
