var socket = io();

var ChatApp = React.createClass({displayName: "ChatApp",
	getInitialState: function() {
		return {users: [], rooms: [], username: '', currentroom: '', messages:[], roomsFilterText: '', usersFilterText: ''}
	},

	componentDidMount: function() {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', encodeURI('https://randomuser.me/api/'));
		xhr.onload = function() {
		    if (xhr.status === 200) {
		    	var username = JSON.parse(xhr.responseText).results[0].user.username;
				socket.emit('add user', username);  
		    }
		    else {
		        alert('Request failed.  Returned status of ' + xhr.status);
		    }
		};
		xhr.send();

		socket.on('header:update', this._updateHeader);

		socket.on('alert', function(msg) { alert(msg); } );

		socket.on('messages:empty', this._clearMessageHistory);

		socket.on('messages:update', this._updateMessages);

		socket.on('users:update', this._updateUsers);

		socket.on('rooms:update', this._updateRooms);

	},

	handleUsernameInput: function(filterText){
		this.setState({usersFilterText: filterText})
	},

	handleUsernameSubmit: function(name) {
		this.setState({usersFilterText: ''})
	 	socket.emit('change user', name);
	},

	handleRoomInput: function(filterText){
		this.setState({roomsFilterText: filterText})
	},

	handleRoomSubmit: function(name) {
		this.setState({roomsFilterText: ''})
    	socket.emit('create room', name);
	},

	handleMessageInput: function(text) {
		// do nothing for now
	},

	handleMessageSubmit: function(text) {
		var msg = {text: text, user: this.state.username, time: (new Date()).toLocaleTimeString(), align: "right"}
		this._updateMessages(msg);
		socket.emit('send message', msg);
	},

	_clearMessageHistory: function() {
		this.setState({messages: []});
	},

	_updateMessages: function(message) {
		var messages = this.state.messages;
		var newMessages = messages.concat(message);
		this.setState({messages: newMessages});
	},

	_updateUsers: function(users) {
		this.setState({users: users});
	},

	_updateRooms: function(rooms) {
		this.setState({rooms: rooms});
	},

	_updateHeader: function(room, name){
		this.setState({currentroom: room, username:name});
	},

	render: function() {
		return (
    	React.createElement("div", {className: "row"}, 
			React.createElement(FilterableRoomPanel, {
				rooms: this.state.rooms, 
				submit: this.handleRoomSubmit, 
				input: this.handleRoomInput, 
				filterText: this.state.roomsFilterText}
			), 
			React.createElement(MessagePanel, {
				submit: this.handleMessageSubmit, 
				username: this.state.username, 
				currentroom: this.state.currentroom, 
				messages: this.state.messages, 
				input: this.handleMessageInput}
			), 	
			React.createElement(FilterableUserPanel, {
				users: this.state.users, 
				submit: this.handleUsernameSubmit, 
				input: this.handleUsernameInput, 
				filterText: this.state.usersFilterText}
			)
   		)
		);
	}
});

var MessagePanel = React.createClass({displayName: "MessagePanel",
	render: function() {
		return (
			React.createElement("div", {id: "message_container", className: "col-xs-6"}, 
				React.createElement("div", {className: "panel panel-default"}, 
					React.createElement(PanelHeader, {
						id: "header", 
						title: this.props.currentroom + " --- Socket.io Chat --- " + this.props.username}
					), 
					React.createElement(MessagePanelBody, {messages: this.props.messages}), 
					React.createElement(PanelFooter, {
						placeholder: "enter a message", 
						icon: "glyphicon glyphicon-send", 
						onFormSubmit: this.props.submit, 
						onUserInput: this.props.input}
					)
				)
			)
		);
	}
});

var MessagePanelBody = React.createClass({displayName: "MessagePanelBody",
	componentWillUpdate: function() {
		var node = React.findDOMNode(this.refs.messages);
		this.shouldScrollBottom = node.scrollTop + node.clientHeight === node.scrollHeight;
	},
	componentDidUpdate: function() {
		if (this.shouldScrollBottom) {
	    var node = React.findDOMNode(this.refs.messages)
	    node.scrollTop = node.scrollHeight
	  }
	},
	render: function() {
		var dataNodes = this.props.messages.map(function(item) {
			if (item.hasOwnProperty('text')) {
				return ( React.createElement(Message, {msg: item}) );
			}
			else {
				return ( React.createElement(ChatEvent, {event: item.event}));
			}
		});
		return (
			React.createElement("div", {className: "panel-body"}, 
				React.createElement("ul", {ref: "messages", className: "media-list"}, 
					dataNodes
				)
			)
		);
	}
})

var Message = React.createClass({displayName: "Message",
	render: function(){
		var msg = this.props.msg
		return(
			React.createElement("li", {className: "media text-" + msg.align}, 
				React.createElement("div", {className: "media-body"}, 
					React.createElement("div", {className: "media"}, 
						React.createElement("a", {className: "pull-" + msg.align, href: "#"}, 
							React.createElement("span", {className: "glyphicon glyphicon-user"})
						), 
						React.createElement("div", {className: "media-body"}, 
							msg.text, 
							React.createElement("br", null), 
							React.createElement("small", {className: "text-muted"}, msg.user, " | ", msg.time), 
							React.createElement("hr", null)
						)
					)
				)
			)
		);
	}
});

var ChatEvent = React.createClass({displayName: "ChatEvent",
	render: function() {
		return(
			React.createElement("li", {className: "text-center"}, React.createElement("small", {className: "text-muted"}, " ", this.props.event, " "))
		);
	}
});

var FilterableUserPanel = React.createClass({displayName: "FilterableUserPanel",
	render: function() {
		return (
			React.createElement("div", {id: "user_container", className: "col-xs-3"}, 
				React.createElement("div", {className: "panel panel-default"}, 
					React.createElement(PanelHeader, {title: "Online Users (" + this.props.users.length + ")"}), 
					React.createElement(PanelBody, {
						id: "users", 
						data: this.props.users, 
						filterText: this.props.filterText}
					), 
					React.createElement(PanelFooter, {
						placeholder: "change your name", 
						icon: "glyphicon glyphicon-edit", 
						onFormSubmit: this.props.submit, 
						filterText: this.props.filterText, 
						onUserInput: this.props.input}
				    )
				)
			)
		);
	}
});

var FilterableRoomPanel = React.createClass({displayName: "FilterableRoomPanel",
	render: function() {
		return (
			React.createElement("div", {id: "room_container", className: "col-xs-3"}, 
				React.createElement("div", {className: "panel panel-default"}, 
					React.createElement(PanelHeader, {title: "Open Rooms (" + this.props.rooms.length + ")"}), 
					React.createElement(PanelBody, {
						id: "rooms", 
						data: this.props.rooms, 
						filterText: this.props.filterText}
					), 
					React.createElement(PanelFooter, {
						placeholder: "create a room", 
						icon: "glyphicon glyphicon-plus", 
						onFormSubmit: this.props.submit, 
						filterText: this.props.filterText, 
						onUserInput: this.props.input}
					)
				)
			)
		);
	}
});

var PanelHeader = React.createClass({displayName: "PanelHeader",
	render: function() {
		return (
			React.createElement("div", {id: this.props.id, className: "panel-heading text-center"}, this.props.title)
		);
	}
})

var PanelBody = React.createClass({displayName: "PanelBody",
	render: function() {
		var dataNodes = this.props.data.map(function(item) {
			if (item.indexOf(this.props.filterText) === -1) {
				return;
			}
			else {
				return (React.createElement("li", {className: "list-group-item", onClick: createHandler(item)}, item) );
				}
			}.bind(this));
			return (
				React.createElement("div", {className: "panel-body"}, 
					React.createElement("ul", {id: this.props.id, className: "media-list"}, 
						dataNodes
					)
			)
		);
	}
})

var PanelFooter = React.createClass({displayName: "PanelFooter",
	handleSubmit: function(e) {
		e.preventDefault();
		var data = React.findDOMNode(this.refs.formInput).value.trim();
		if (!data) {
		return;
		}
		this.props.onFormSubmit(data);
		React.findDOMNode(this.refs.formInput).value = '';
		return;
	},

	handleChange: function() {
		this.props.onUserInput(
			React.findDOMNode(this.refs.formInput).value
		)
	},

	render: function() {
		return (
			React.createElement("div", {className: "panel-footer"}, 
	        React.createElement("form", {id: "send", onSubmit: this.handleSubmit}, 
	          React.createElement("div", {className: "input-group"}, 
	            React.createElement("input", {
	            	type: "text", 
	            	className: "form-control", 
	            	autoComplete: "off", 
	            	placeholder: this.props.placeholder, 
	            	ref: "formInput", 
	            	onChange: this.handleChange}
	            ), 
	            React.createElement("span", {className: "input-group-btn"}, 
	            	React.createElement("button", {className: "btn btn-info"}, 
	            		React.createElement("span", {className: this.props.icon})
	            	)
	            )
	          )
	        )
	      ) 
		);
	}
});

React.render( React.createElement(ChatApp, null) , document.getElementById("chatApp"));

function switchRoom(name) {
  socket.emit('switch room', name);
}

function createHandler(id) {
  return function(e) {
    switchRoom(id);
  };
}
