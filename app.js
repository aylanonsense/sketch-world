//configure requirejs
var requirejs = require('requirejs');
requirejs.config({ baseUrl: __dirname + '/javascripts', nodeRequire: require });
require = requirejs;

//dependencies
var express = require('express');
var socketIO = require('socket.io');
var GameConnectionServer = require('server/net/GameConnectionServer');
var Main = require('server/Main');

//set up node server
var app = express();
app.use(express.static(__dirname + '/webnonsense'));
app.use('/client', express.static(__dirname + '/javascripts/client'));
app.use('/shared', express.static(__dirname + '/javascripts/shared'));
var server = app.listen(process.env.PORT || 3000);
var socketServer = socketIO(server);
socketServer.on('connection', GameConnectionServer.handleSocket);

//start server application
Main();