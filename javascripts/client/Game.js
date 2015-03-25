define([
	'client/net/GameConnection',
	'client/Clock'
], function(
	GameConnection,
	Clock
) {
	GameConnection.on('connect', function() {
		console.log("Connected!");
	});
	GameConnection.on('sync', function() {
		console.log("Synced!");
	});
	GameConnection.on('receive', function(msg) {
		console.log("Received:", msg);
	});
	GameConnection.on('disconnect', function() {
		console.log("Disconnected!");
	});
	setInterval(function() {
		if(GameConnection.isSynced()) {
			GameConnection.bufferSend({ from: 'CLIENT!' });
			console.log("gameTime", Clock.getGameTime());
		}
	}, 1000);
	return {
		reset: function() {},
		tick: function(t, tServer) {},
		render: function(ctx) {},
		onMouseEvent: function(evt) {},
		onKeyboardEvent: function(evt, keyboard) {}
	};
});