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
		var playableEntity = new Ball(100 + 600 * Math.random(), 100 + 400 * Math.random());
		entities.push(playableEntity);
		conn.on('sync', function() {
			sendGameState(conn);
			conn.bufferSend({
				messageType: 'grant-entity-ownership',
				entityId: playableEntity.entityId
			});
		});
	});
	return {
		tick: function(t) {
			for(var i = 0; i < entities.length; i++) {
				entities[i].tick(t);
			}
		}
	};
});