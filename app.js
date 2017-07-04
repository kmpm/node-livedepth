const debug = require('debug')('livedepth:app');
const express = require('express')

const middleware = require('./lib/middleware')

const app = express()
app.set('port', process.env.PORT || 3000);

app.use(middleware.nocache)

// app.use(require('connect-livereload')({
//     port: 35729
//   }));

app.use(express.static('public'));
app.use('/data/', require('./routes/data'));

var server = app.listen(app.get('port'), function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('running %s %s', host, port);
});

var livereload = require('livereload');
var lrserver = livereload.createServer();
lrserver.watch(__dirname + "/public");