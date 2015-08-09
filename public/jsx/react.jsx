var socket = io();

var ChatApp = React.createClass({
	getInitialState: function() {
		return {users: [], rooms: [], username: "", currentroom: "", messages:[]}
	},
	componentDidMount: function() {
	  $.ajax({
	    url: 'https://randomuser.me/api/',
	    dataType: 'json',
	    success: function(data){
	      var username = data.results[0].user.username;
	      socket.emit('add user', username);
	    }
	  });

	  socket.on('header:update', this._updateHeader);

	  socket.on('alert', function(msg) { alert(msg); } );

	  socket.on('messages:empty', this._clearMessageHistory);

		socket.on('chat message', this._showChatMessage);

	  socket.on('chat event', this._showChatEvent);

	  socket.on('update users', this._updateUsers);

	  socket.on('rooms:refresh', this._updateRooms);

	},

	handleUsernameSubmit: function(name) {
	  socket.emit('change user', name);
	},

	handleRoomSubmit: function(name) {
    socket.emit('create room', name);
	},

	handleMessageSubmit: function(text) {
		var msg = {text: text, user: this.state.username, time: (new Date()).toLocaleTimeString(), align: "right"}
		this._showChatMessage(msg)
	  socket.emit('send message', msg);
	},

	_showChatEvent: function(text) {
		var messages = this.state.messages;
		var event = {event: text}
		var newMessages = messages.concat(event);
		this._updateMessages(newMessages);
	},

	_showChatMessage: function(msg) {
		var messages = this.state.messages;
		var newMessages = messages.concat(msg);
	  this._updateMessages(newMessages);
	},

	_clearMessageHistory: function() {
		this.setState({messages: []});
	},

	_updateUsers: function(users) {
		this.setState({users: users});
	},

	_updateMessages: function(messages) {
		this.setState({messages: messages});
	},

	_updateRooms: function(rooms) {
		this.setState({rooms: rooms});
	},

	_updateHeader: function(room, name){
		this.setState({currentroom: room, username:name});
	},

	render: function() {
		return (
    	<div className="row">
				<RoomPanel 
					rooms={this.state.rooms}
					submit={this.handleRoomSubmit}
				/>			
				<MessagePanel 
					submit={this.handleMessageSubmit}
					username={this.state.username}
					currentroom={this.state.currentroom}
					messages={this.state.messages}
				/>	
				<UserPanel 
					users={this.state.users}
					submit={this.handleUsernameSubmit}
				/>
   		</div>
		);
	}
});

var MessagePanel = React.createClass({
	render: function() {
		return (
			<div id = "message_container" className="col-xs-6">
				<div className="panel panel-default">
					<PanelHeader 
						id="header" 
						title={this.props.currentroom + " --- Socket.io Chat --- " + this.props.username}
					/>
					<MessagePanelBody messages={this.props.messages}/>
					<PanelFooter 
						placeholder="enter a message"
						icon="glyphicon glyphicon-send"
						onFormSubmit={this.props.submit}
					/>
				</div>
			</div>
		);
	}
});

var MessagePanelBody = React.createClass({
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
				return ( <Message msg={item} /> );
			}
			else {
				return ( <ChatEvent event={item.event} />);
			}
		});
		return (
			<div className="panel-body">
				<ul ref="messages" className="media-list">
					{dataNodes}
				</ul>
			</div>
		);
	}
})

var Message = React.createClass({
	render: function(){
		var msg = this.props.msg
		return(
			<li className={"media text-" + msg.align}>
		  	<div className="media-body">
		    	<div className="media">
            <a className={"pull-" + msg.align} href="#">
              <span className="glyphicon glyphicon-user"></span>
            </a>
            <div className="media-body">
              {msg.text}
              <br />
             <small className="text-muted">{msg.user} | {msg.time}</small>
              <hr />
            </div>
	        </div>
		    </div>
			</li>
		);
	}
});

var ChatEvent = React.createClass({
	render: function() {
		return(
			<li className="text-center"><small className="text-muted"> {this.props.event} </small></li>
		);
	}
});

var UserPanel = React.createClass({
	render: function() {
		return (
			<div id = "user_container" className="col-xs-3">
				<div className="panel panel-default">
	        <PanelHeader title="Online Users" />
	        <PanelBody id="users" data={this.props.users}/>
	        <PanelFooter 
	        	placeholder="change your name" 
	        	icon="glyphicon glyphicon-edit"
	        	onFormSubmit={this.props.submit}
	        />
	      </div>
	    </div>
		);
	}
});

var RoomPanel = React.createClass({
	render: function() {
		return (
		<div id = "room_container" className="col-xs-3">
			<div className="panel panel-default">
	      <PanelHeader title="Open Rooms" />
	      <PanelBody id="rooms" data={this.props.rooms}/>
	      <PanelFooter 
	      	placeholder="create a room" 
	      	icon="glyphicon glyphicon-plus"
	      	onFormSubmit={this.props.submit}
	      />
	    </div>
	   </div>
		);
	}
});

var PanelHeader = React.createClass({
	render: function() {
		return (
			<div id={this.props.id} className="panel-heading text-center">{this.props.title}</div>
		);
	}
})

var PanelBody = React.createClass({
	render: function() {
		var dataNodes = this.props.data.map(function(item) {
			return (
				<li className="list-group-item" onClick={createHandler(item)}>{item}</li> 
			);
		});
		return (
			<div className="panel-body">
				<ul id={this.props.id} className="media-list">
					{dataNodes}
				</ul>
			</div>
		);
	}
})

var PanelFooter = React.createClass({
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

	},

	render: function() {
		return (
			<div className="panel-footer">
        <form id="send" onSubmit={this.handleSubmit}>
          <div className="input-group">
            <input 
            	type="text"
            	className="form-control" 
            	autoComplete="off"
            	placeholder={this.props.placeholder} 
            	ref="formInput"
            />
            <span className="input-group-btn">
            	<button className="btn btn-info">
            		<span className={this.props.icon}></span>
            	</button>
            </span>
          </div>
        </form>
      </div> 
		);
	}
});

React.render( <ChatApp /> , document.getElementById("chatApp"));

function switchRoom(name) {
  socket.emit('switch room', name);
}

function createHandler(id) {
  return function(e) {
    switchRoom(id);
  };
}
