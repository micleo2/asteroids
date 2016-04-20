var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketPool = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket){
  socketPool[socket.id] = socket;
  socket.on("playerUpdate", function (player) {
    socket.broadcast.emit('playerUpdate', {id: socket.id, player: player});
  });
  socket.on("fireBullet", function (bulObj) {
    bulObj.id = socket.id;
    socket.broadcast.emit('fireBullet', bulObj);
  });
  socket.on("bulletHit", function (bulObj) {
    if (socketPool.hasOwnProperty("" + bulObj.id)){
      socketPool[bulObj.id].emit("bulletSuccess", bulObj);
    }
  })

  socket.on("disconnect", function () {
    io.emit("playerLeft", {id: socket.id});
    delete socketPool[socket.id];
  });
});

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
