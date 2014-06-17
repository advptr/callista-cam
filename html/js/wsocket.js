function WSocket(host, port) {
    var socket;

    var connect = function(url) {
        console.log("Trying to connect to: " + url);
        socket = io.connect(url);

    };

    var on = function(type, action) {
        socket.on(type, action);
    };

    var emit = function(type, data, callback) {
        socket.emit(type, data, callback);
    };

    var once = function(type, data, callback) {
        socket.once(type, data, callback);
    };


    var url = host;
    if (port) {
        url = ":" + port;
    }
    connect(url);

    return {
        listen: function(type, fn) {
            on(type, fn);
        },

        send: function(type, data, callback) {
            emit(type, data, callback);
        },

        once: function(type, data, callback) {
            once(type, data, callback);
        }

    }
}