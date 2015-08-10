var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){

  res.sendFile(__dirname + '/index.html');

});

app.use(express.static(__dirname + '/public'));

var usernames = {};
var rooms = {'lobby' : true};

var socketTable = {};
var roomTable = {};

io.on('connection', function(socket){

  socket.on('add user', function(name){
    socket.username = name;
    socket.room = 'lobby';
    socket.join('lobby');
    socket.emit('chat event','hello, ' + name + '! you have entered the lobby');
    socket.broadcast.to('lobby').emit('chat event', socket.username + " has joined the chat");
    usernames[socket.username] = true;
    updateUsers();
    updateRooms();
    updateHeader(socket);
  });
 
  // broadcast chat event to everyone except sender
  socket.on('send message', function(msg){
    msg.align = "left";
    socket.broadcast.to(socket.room).emit('chat message', msg);
  });

  socket.on('create room', function(name){
    createRoom(name, socket);
  });

  socket.on('switch room', function(name){
    switchRoom(name, socket);
  });

  socket.on('change user', function(name){
    changeUser(name, socket);
  });

  // emit a disconnected message to all clients
  socket.on('disconnect', function(){
    socket.broadcast.to(socket.room).emit('chat event', socket.username + " has left the chat");
    removeUser(socket);
  });

  function updateHeader(socket){
    socket.emit('header:update', socket.room, socket.username);
  }

  function updateUsers(){
    io.emit("update users", Object.keys(usernames).sort());
  }

  function updateRooms(){
    io.emit("rooms:refresh", Object.keys(rooms).sort());
  }

  function removeUser(socket){
    var name = socket.username;   
    delete usernames[name];
    updateUsers();
  }

  function changeUser(name, socket) {
    name = name.toLowerCase();

    if (!usernames[name] && name){      
      removeUser(socket);
      socket.broadcast.to(socket.room).emit('chat event', socket.username + " is now " + name);
      socket.username = name;
      usernames[name] = true;
      updateUsers();
      updateHeader(socket);
    }
    else {
      socket.emit("alert", name + " already exists!");
    }
  }

  function leaveRoom(socket){
    socket.broadcast.to(socket.room).emit('chat event', socket.username + " has left the chat");
    socket.leave(socket.room);
    socket.room = null;
  }

  function joinRoom(name, socket){
    if (name && rooms[name] && socket.room != name){
      socket.room = name;
      socket.join(name);
      socket.broadcast.to(name).emit('chat event', socket.username + " has joined the chat");
      socket.emit('messages:empty');
      socket.emit('chat event', 'you are now in ' + name);
      updateHeader(socket);
    }
  }

  function switchRoom(name, socket){
    if (name && rooms[name] && socket.room != name){
      leaveRoom(socket);
      joinRoom(name, socket);
    }
  }

  function createRoom(name, socket){
    // all names lowercase
    name = name.toLowerCase();
    // if a room exists create it
    if (!rooms[name] && name){
      rooms[name] = true;
      leaveRoom(socket);
      joinRoom(name, socket);
      updateRooms();
    }
    else {
      socket.emit("alert", name + " already exists!");
    }
  }

});

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
