/*jshint esnext: true*/

  // submit a message to the server
  $('#send').submit(sendChatMessage);
  $("#create").submit(createNewRoom);
  $("#change").submit(changeUserName);

  var socket = io();
  var username;

  $.ajax({
    url: 'https://randomuser.me/api/',
    dataType: 'json',
    success: function(data){
      username = data.results[0].user.username;
      socket.emit('add user', username);
    }
  });

  socket.on('header:update', updateHeader);

  socket.on('messages:empty', emptyMessages);

  socket.on('update name', setUser);

  socket.on('rooms:refresh', refreshRooms);

  socket.on('chat message', showChatMessage);

  socket.on('chat event', sendChatEvent);

  socket.on('update users', updateUsers);

  socket.on('alert', function(msg) { alert(msg); } );

  function updateHeader(room, name){
  	$('#header').text(room + " --- Socket.io Chat --- " + name);
  }

  function sendChatMessage() {
    var msg = $('#newChatMessage').val();
    if (msg){
      showChatMessage(msg, username, (new Date()).toLocaleTimeString(), "right");
      socket.emit('send message', msg);
      $('#newChatMessage').val('');
    }
    return false;
  }

  function changeUserName(){
    var name = $("#newUserName").val();
    if (name) {
      $("#newUserName").val('');
      socket.emit('change user', name);
    }
    return false;
  }

  function createNewRoom() {
    var name = $("#newRoomName").val();
    if (name) {
      $("#newRoomName").val('');
      socket.emit('create room', name);
    }
    return false;
  }

  function emptyMessages(){
  	$('#messages').empty();
  }

  function setUser(name){
  	username = name;
  }

  function showChatMessage(msg, user, time, align){
	$('<li class="media text-' + align + '">' +
	  	'<div class="media-body">' +
	    	'<div class="media">' +
	            '<a class="pull-' + align + '" href="#">' +
	                '<span class="glyphicon glyphicon-user"></span>' +
	            '</a>' +
	            '<div class="media-body">' +
	                msg +
	                '<br />' +
	               '<small class="text-muted">' + user + ' | ' + time + '</small>' +
	                '<hr />' +
	            '</div>' +
	        '</div>' +
	    '</div>' +
	'</li>').appendTo($('#messages'));
    $("#messages").prop({ scrollTop: $("#messages").prop("scrollHeight") });
  }

  function sendChatEvent(msg) {
  	$('<li class="text-center"><small class="text-muted">' + msg+ '</small></li>').appendTo($('#messages'));
  	$("#messages").prop({ scrollTop: $("#messages").prop("scrollHeight") });
  }

  function updateUsers(userlist) {
    $('#users').empty();
    for (var name of userlist) {
      $('#users').append($('<li class="list-group-item">').text(name));
    }
  }

  function refreshRooms(roomlist){
    $('#rooms').empty();
    for (var name of roomlist) {
      $('<li id =' + name.toLowerCase() + ' class="list-group-item">' + name + "</li>").appendTo($('#rooms')).click(createHandler(name));
    }
  }

  function switchRoom(name) {
    socket.emit('switch room', name);
  }

  function createHandler(id) {
    return function(e) {
      switchRoom(id);
    };
  }


