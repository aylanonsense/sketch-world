define([
	'server/net/GameConnectionServer',
	'server/Clock',
	'server/entity/PhysBall',
	'shared/level/Level'
], function(
	GameConnectionServer,
	Clock,
	PhysBall,
	Level
) {
	//set up entities
	var entities = [];
	function getEntity(id) {
		for(var i = 0; i < entities.length; i++) {
			if(entities[i].entityId === id) {
				return entities[i];
			}
		}
		return null;
	}
	function despawnEntity(id) {
		entities = entities.filter(function(entity) {
			return entity.entityId !== id;
		});
	}

	//set up level
	var level = new Level({
		polygons: [
			{ id: 4, points: [ 100,100, 200,100, 200,200, 100,200 ] },
			{ id: 7, points: [ 300,300, 400,500, 500,300 ] }
		]
	});

	var timeUntilStateUpdate = 0.0;
	GameConnectionServer.on('connect', function(conn) {
		console.log("[" + conn.connId + "] Connected!");
		var playableEntity = new PhysBall(100 + 600 * Math.random(), 100 + 400 * Math.random());
		entities.push(playableEntity);
		GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
			conn.bufferSend({
				messageType: 'spawn-entity',
				entity: playableEntity.getState()
			});
		});
		conn.on('sync', function() {
			// console.log("[" + conn.connId + "] Synced!");
			conn.bufferSend({
				messageType: 'game-state',
				state: {
					entities: entities.map(function(entity) {
						return entity.getState();
					}),
					level: level.getState(),
					playableEntityId: playableEntity.entityId
				}
			});
		});
		conn.on('receive', function(msg) {
			// console.log("[" + conn.connId + "] Received:", msg);
			if(msg.messageType === 'player-input') {
				playableEntity.onInputFromClient(msg.input, msg.details);
			}
		});
		conn.on('disconnect', function() {
			console.log("[" + conn.connId + "] Disconnected!");
			GameConnectionServer.forEachSynced(function(conn) {
				conn.bufferSend({
					messageType: 'despawn-entity',
					entityId: playableEntity.entityId
				});
			});
			despawnEntity(playableEntity.entityId);
			playableEntity = null;
		});
	});
	return {
		tick: function(t) {
			for(var i = 0; i < entities.length; i++) {
				entities[i].tick(t);
			}

			timeUntilStateUpdate -= t;
			if(timeUntilStateUpdate <= 0.0) {
				timeUntilStateUpdate = 1.4;
				GameConnectionServer.forEachSynced(function(conn) {
					for(var i = 0; i < entities.length; i++) {
						conn.bufferSend({
							messageType: 'entity-state-update',
							entity: entities[i].getState()
						});
					}
				});
			}
		}
	};
});