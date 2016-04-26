var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketPool = {};
var port = 3000;

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

  socket.on("chat message", function (content) {
    io.emit('chat message', content);
  });
});
if (process.env.IP){
  http.listen(process.env.PORT || port, process.env.IP, function(){
    console.log('listening on *:' + (process.env.PORT || port));
  });
}else{
  http.listen(process.env.PORT || port, function(){
    console.log('listening on *:' + (process.env.PORT || port));
  });
}
