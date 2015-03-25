define([
	'server/net/GameConnectionServer',
	'server/Clock'
], function(
	GameConnectionServer,
	Clock
) {
	GameConnectionServer.on('connect', function(conn) {
		console.log("[" + conn.connId + "] Connected!");
		var interval = null;
		conn.on('sync', function() {
			console.log("[" + conn.connId + "] Synced!");
			if(!interval) {
				interval = setInterval(function() {
					conn.bufferSend({ from: 'SERVER!' });
					console.log("gameTime:", Clock.getGameTime());
				}, 1000);
			}
		});
		conn.on('receive', function(msg) {
			console.log("[" + conn.connId + "] Received:", msg);
		});
		conn.on('disconnect', function() {
			console.log("[" + conn.connId + "] Disconnected!");
			if(interval) {
				clearInterval(interval);
			}
		});
	});
	return {
		tick: function(t) {}
	};
});