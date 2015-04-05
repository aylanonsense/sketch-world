define([
	'server/net/GameConnectionServer',
	'server/Clock',
	'server/entity/PhysBall',
	'shared/handleCollisions',
	'server/database/Database',
	'shared/level/Level'
], function(
	GameConnectionServer,
	Clock,
	PhysBall,
	handleCollisions,
	Database,
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
	var level = new Level();
	var levelLoaded = false;
	Database.getAllPolygons(function(polys) {
		level.setState({
			polygons: polys.map(function(poly) {
				return { id: poly.id, points: poly.points };
			})
		});
		levelLoaded = true;
		console.log("Level loaded!");
	});

	var timeUntilStateUpdate = 0.0;
	GameConnectionServer.on('connect', function(conn) {
		if(!levelLoaded) {
			conn.disconnect();
			console.log("[" + conn.connId + "] Rejected! (level not loaded)");
			return;
		}
		console.log("[" + conn.connId + "] Connected!");
		var playableEntity = new PhysBall(0, 0);
		var tempIdLookup = {};
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
			else if(msg.messageType === 'add-polygon-request') {
				var tempClientId = msg.state.tempPolyId;
				var tempPolygon = level.addTempPolygon(msg.state, 'server');
				var tempServerId = tempPolygon.tempPolyId;
				GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
					conn.bufferSend({
						messageType: 'add-temp-polygon',
						state: tempPolygon.getState()
					});
				});
				Database.addPolygon(msg.state, function(polyModel) {
					var polygon = level.replaceTempPolygon(tempPolygon.tempPolyId, {
						id: polyModel.id,
						tempPolyId: tempServerId,
						points: polyModel.points
					});
					tempIdLookup[tempClientId] = polygon.polyId;
					conn.bufferSend({
						messageType: 'replace-temp-polygon',
						tempId: tempClientId,
						state: polygon.getState()
					});
					GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
						conn.bufferSend({
							messageType: 'replace-temp-polygon',
							tempId: tempServerId,
							state: polygon.getState()
						});
					});
				});
			}
			else if(msg.messageType === 'modify-polygon-request') {
				var polygon = level.getPolygon(msg.state);
				polygon.setState(msg.state);
				GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
					conn.bufferSend({
						messageType: 'modify-polygon',
						state: polygon.getState()
					});
				});
				Database.modifyPolygon(msg.state);
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