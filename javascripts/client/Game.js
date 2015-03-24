define([
	'client/net/GameConnection'
], function(
	GameConnection
) {
	GameConnection.on('connect', function() {
		console.log("Connected!");
	});
	GameConnection.on('receive', function(msg) {
		console.log("Received", msg);
	});
	GameConnection.on('disconnect', function() {
		console.log("Disconnected!");
	});
	setInterval(function() {
		GameConnection.bufferSend({ from: 'CLIENT!' });
	}, 1000);
	return {
		reset: function() {},
		tick: function(t, tServer) {},
		render: function(ctx) {},
		onMouseEvent: function(evt) {},
		onKeyboardEvent: function(evt, keyboard) {}
	};
});