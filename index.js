var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket){
  socket.on("playerUpdate", function (player) {
    socket.broadcast.emit('playerUpdate', {id: socket.id, player: player});
  });
  socket.on("fireBullet", function (bulObj) {
    socket.broadcast.emit('fireBullet', bulObj);
  });
});

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
