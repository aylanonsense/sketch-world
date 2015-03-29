define([
	'server/net/GameConnectionServer',
	'server/Clock',
	'server/entity/PhysBall',
	'shared/handleCollisions',
	'shared/level/Level'
], function(
	GameConnectionServer,
	Clock,
	PhysBall,
	handleCollisions,
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
			{ id: 0, points: [-200,100, 200,100, 200,150, -200,150 ] },
			{ id: 1, points: [-550,130, -500,160, -450,180, -400,190,
				-350,180, -300,160, -250,130, -250,200, -550,200 ] }
		]
	});

	var timeUntilStateUpdate = 0.0;
	GameConnectionServer.on('connect', function(conn) {
		console.log("[" + conn.connId + "] Connected!");
		var playableEntity = new PhysBall(0, 0);
		entities.push(playableEntity);
		GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
			conn.bufferSend({
				messageType: 'spawn-entity',
				entity: playableEntity.getState()
			});
		});
		conn.on('sync', function() {
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
			if(msg.messageType === 'player-input') {
				playableEntity.onInputFromClient(msg.input, msg.details);
			}
			else if(msg.messageType === 'player-state-suggestion') {
				//in a proper client-server architecture we wouldn't allow state suggestions from
				// the client... but for this game it's fine
				playableEntity.setState(msg.state);
			}
		});
		conn.on('disconnect', function() {
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
				entities[i].startOfFrame(t);
			}

			for(i = 0; i < entities.length; i++) {
				entities[i].tick(t);
				handleCollisions(entities[i].sim, level, t);
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

			for(i = 0; i < entities.length; i++) {
				entities[i].endOfFrame(t);
			}
		}
	};
});