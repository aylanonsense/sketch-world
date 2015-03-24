define([
	'server/net/GameConnectionServer'
], function(
	GameConnectionServer
) {
	GameConnectionServer.on('connect', function(conn) {
		console.log("Connection " + conn.connId + " connected!");
		conn.on('receive', function(msg) {
			console.log("Received", msg);
		});
		conn.on('disconnect', function() {
			console.log("Connection " + conn.connId + " disconnected!");
		});
		setInterval(function() {
			conn.bufferSend({ from: 'SERVER!' });
		}, 1000);
	});
	return {
		tick: function(t) {}
	};
});