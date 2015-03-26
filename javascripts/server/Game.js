define([
	'server/net/GameConnectionServer',
	'server/Clock',
	'server/entity/Ball'
], function(
	GameConnectionServer,
	Clock,
	Ball
) {
	//create game entities
	var entities = [];
	for(var i = 0; i < 10; i++) {
		entities.push(new Ball(100 + 600 * Math.random(), 100 + 400 * Math.random()));
	}

	function sendGameState(conn) {
		conn.bufferSend({
			messageType: 'game-state',
			state: {
				entities: entities.map(function(entity) {
					return entity.getState();
				})
			}
		});
	}

	GameConnectionServer.on('connect', function(conn) {
		console.log("[" + conn.connId + "] Connected!");
		conn.on('sync', function() {
			console.log("[" + conn.connId + "] Synced!");
			sendGameState(conn);
		});
		conn.on('receive', function(msg) {
			console.log("[" + conn.connId + "] Received:", msg);
		});
		conn.on('desync', function(msg) {
			console.log("[" + conn.connId + "] Desynced!");
		});
		conn.on('disconnect', function() {
			console.log("[" + conn.connId + "] Disconnected!");
		});
	});
	return {
		tick: function(t) {
			for(var i = 0; i < entities[i].length; i++) {
				entities[i].tick(t);
			}
		}
	};
});