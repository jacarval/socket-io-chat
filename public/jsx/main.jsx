var socket = io();

var ChatApp = React.createClass({
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
    	<div className="row">
			<FilterableRoomPanel 
				rooms={this.state.rooms}
				submit={this.handleRoomSubmit}
				input={this.handleRoomInput}
				filterText={this.state.roomsFilterText}
			/>
			<MessagePanel 
				submit={this.handleMessageSubmit}
				username={this.state.username}
				currentroom={this.state.currentroom}
				messages={this.state.messages}
				input={this.handleMessageInput}
			/>	
			<FilterableUserPanel 
				users={this.state.users}
				submit={this.handleUsernameSubmit}
				input={this.handleUsernameInput}
				filterText={this.state.usersFilterText}
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
						onUserInput={this.props.input}
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

var FilterableUserPanel = React.createClass({
	render: function() {
		return (
			<div id = "user_container" className="col-xs-3">
				<div className="panel panel-default">
					<PanelHeader title={"Online Users (" + this.props.users.length + ")"}  />
					<PanelBody 
						id="users" 
						data={this.props.users}
						filterText={this.props.filterText}
					/>
					<PanelFooter 
						placeholder="change your name" 
						icon="glyphicon glyphicon-edit"
						onFormSubmit={this.props.submit}
						filterText={this.props.filterText}
						onUserInput={this.props.input}
				    />
				</div>
			</div>
		);
	}
});

var FilterableRoomPanel = React.createClass({
	render: function() {
		return (
			<div id = "room_container" className="col-xs-3">
				<div className="panel panel-default">
					<PanelHeader title={"Open Rooms (" + this.props.rooms.length + ")"} />
					<PanelBody 
						id="rooms" 
						data={this.props.rooms}
						filterText={this.props.filterText}
					/>
					<PanelFooter 
						placeholder="create a room" 
						icon="glyphicon glyphicon-plus"
						onFormSubmit={this.props.submit}
						filterText={this.props.filterText}
						onUserInput={this.props.input}
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
			if (item.indexOf(this.props.filterText) === -1) {
				return;
			}
			else {
				return (<li className="list-group-item" onClick={createHandler(item)}>{item}</li> );
				}
			}.bind(this));
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
		this.props.onUserInput(
			React.findDOMNode(this.refs.formInput).value
		)
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
	            	onChange={this.handleChange}
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
