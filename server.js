//

process.on('uncaughtException', function (err) {
	console.log(err);
	if (err.fatal) {
		process.exit(1);
	}
});

Array.prototype.remove = function(e) {
	var i = this.indexOf(e);
	if (i != -1) {
		return this.splice(i, 1);
	}
	return this;
}

var root = '/html',
socketio = require('socket.io'), 
connect = require('connect'), 
http = require('http'),
argv = require('optimist').usage('Usage: $0 --port [http_port] --secret [pass]').default('port', 8080).demand(['secret']).argv,
app = connect(),
basicAuth = require('basic-auth-connect'),
compression = require('compression');

// gzip/deflate outgoing responses
app.use(basicAuth(function(username, password) {
	return (username == argv.secret || password == argv.secret);
}));

app.use(compression());
app.use(connect.static(__dirname + root));

function Channel(name, publisher) {
	this.name = name;
	this.publisher = publisher;
	this.subscribers = [];
	
	this.remove = function(socket) {
		this.subscribers.remove(socket);
	}
	this.add = function(socket) {
		this.subscribers.push(socket);
	}

	Channel.channels[this.name] = this;
}

Channel.prototype.broadcast = function(name, data) {
	for (var i = 0; i < this.subscribers.length; i++) {
		this.subscribers[i].emit(name, data);
	}		
}

Channel.each = function(callback) {
	for (var key in Channel.channels) {
		if (Channel.channels.hasOwnProperty(key)) {
			callback(Channel.channels[key]);
		}
	}
}


Channel.channels = [];

var removeSubscriber = function(socket) {
	console.log('removeSubscriber: ' + socket.id);
	Channel.each(function(channel) {
		channel.remove(socket);
	});
}

var addSubscriber = function(name, socket) {
	console.log('addSubscriber: ' + socket.id);
	var channel = Channel.channels[name];
	if (channel) {
		channel.add(socket);
	}
}

var removePublisher = function(publisher) {
	console.log('removePublisher: ' + publisher);
	var dirty = false;
	Channel.each(function(channel) {
		console.log('publisher: ' + channel.publisher);
		if (channel.publisher === publisher) {
			delete Channel.channels[channel.name];
			dirty = true;
			return;
		}
	});
	return dirty;
}

var getChannels = function() {
	var names = [];
	Channel.each(function(channel) {
		names.push(channel.name);
	});	
	return names;
}


	
// WebServer handler
var server = http.createServer(app).listen(argv.port, function(request, response) {
	console.log('Listening at: http://localhost:' + argv.port);
});

// Websocket server handler
var io = socketio.listen(server).on('connection', function(socket) {
	
	var announceChannels = function() {
		io.emit('channels', getChannels());
	}

	console.log('socket connected: ' + socket.id);
	socket.emit('channels', getChannels());

	socket.on('frame', function(data) {
		var channel = Channel.channels[data.channel];
		if (channel) {
			channel.broadcast('frame', data);
		} else {
			console.log('channel created: ' + data.channel + ' by ' + socket.id);
			new Channel(data.channel, socket.id);
			announceChannels();
		}
	}).on('disconnect', function() {
		console.log('socket disconnected: ' + socket.id);
		removeSubscriber(socket);
		if (removePublisher(socket.id)) {
			announceChannels();
		}
	}).on('subscribe', function(name) {
		removeSubscriber(socket);
		addSubscriber(name, socket);
	}).on('unsubscribe', function() {
		removeSubscriber(socket);
	}).on('unpublish', function() {
		if (removePublisher(socket.id)) {
			announceChannels();
		}
	});
});
