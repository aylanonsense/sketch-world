define([
	'server/net/GameConnectionServer',
	'server/Constants',
	'server/Clock',
	'server/entity/PhysBall',
	'shared/handleCollisions',
	'server/database/Database',
	'shared/level/Level'
], function(
	GameConnectionServer,
	Constants,
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
	var levelLoaded = false;
	function loadLevel() {
		Database.getAllPolygons(function(polyModels) {
			for(var i = 0; i < polyModels.length; i++) {
				var polygon = Level.createPolygonAndAssignId({
					points: polyModels[i].points
				});
				polygon.databaseId = polyModels[i].id;
			}
			levelLoaded = true;
			console.log("Level loaded!");
		});
	}
	if(Constants.REBUILD_DATABASE_ON_RESTART) {
		Database.reset(function() {
			console.log("Database reset!");
			loadLevel();
		});
	}
	else {
		loadLevel();
	}

	//set up handlers for each connecting player
	var timeUntilStateUpdate = 0.0;
	GameConnectionServer.on('connect', function(conn) {
		//players that connect before the level is loaded get rejected
		if(!levelLoaded) {
			conn.disconnect();
			console.log("[" + conn.connId + "] Rejected! (level not loaded)");
			return;
		}

		//player connected!
		console.log("[" + conn.connId + "] Connected!");
		var playableEntity = new PhysBall(0, 0);
		var tempIdLookup = {};
		entities.push(playableEntity);

		//everyone else gets notified of the new player's entity
		GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
			conn.bufferSend({
				messageType: 'spawn-entity',
				entity: playableEntity.getState()
			});
		});

		//when the player's connection is synced, we send them information about the game
		conn.on('sync', function() {
			conn.bufferSend({
				messageType: 'game-state',
				state: {
					entities: entities.map(function(entity) {
						return entity.getState();
					}),
					level: Level.getState(),
					playableEntityId: playableEntity.entityId
				}
			});
		});

		//when the player sends us a message, the server responds
		conn.on('receive', function(msg) {
			var polygon;

			//player is moving around
			if(msg.messageType === 'player-input') {
				playableEntity.onInputFromClient(msg.input, msg.details);
			}

			//client wants the server to sync up with them
			else if(msg.messageType === 'player-state-suggestion') {
				//in a proper client-server architecture we wouldn't allow state suggestions from
				// the client... but for this game it's fine
				playableEntity.setState(msg.state);
			}

			//client wants to create a new polygon
			else if(msg.messageType === 'create-polygon-request') {
				var tempId = msg.state.id;
				polygon = Level.createPolygonAndAssignId(msg.state);
				tempIdLookup[tempId] = polygon.id;
				//inform the client of the actual server-side id
				conn.bufferSend({
					messageType: 'update-polygon-id',
					tempId: tempId,
					id: polygon.id
				});
				//inform other clients of the new polygon
				GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
					conn.bufferSend({
						messageType: 'create-polygon',
						state: polygon.getState()
					});
				});
				//persist the polygon in the database
				Database.createPolygon(polygon.getState(), function(polyModel) {
					polygon.databaseId = polyModel.id;
					//if other changes took place that need to be persisted, save the polygon immediately
					if(polygon.needsToBePersisted) {
						Database.savePolygon(polygon.databaseId, polygon.getState(), function() {
							polygon.needsToBePersisted = false;
						});
					}
				});
			}

			//client wants to modify an existing polygon
			else if(msg.messageType === 'modify-polygon-request') {
				//if client is still referring to an old id, we translate it to the new server-side id
				if(typeof tempIdLookup[msg.state.id] !== 'undefined') {
					msg.state.id = tempIdLookup[msg.state.id];
				}
				//find the polygon with that id
				polygon = Level.getPolygonById(msg.state.id);
				//modify it according the client's actions
				if(msg.modifyType === 'move') {
					polygon.move(msg.x, msg.y);
				}
				//send the update to the clients
				GameConnectionServer.forEachSynced(function(conn) {
					conn.bufferSend({
						messageType: 'update-polygon-state',
						state: polygon.getState()
					});
				});
				//if the polygon has not yet been created in the database, all we can do is flag it as requiring a save
				if(polygon.databaseId === null) {
					polygon.needsToBePersisted = true;
				}
				//otherwise we save the polygon
				else {
					Database.savePolygon(polygon.databaseId, polygon.getState());
				}
			}

			//client wants to delete an existing polygon
			else if(msg.messageType === 'delete-polygon-request') {
				//if client is still referring to an old id, we translate it to the new server-side id
				if(typeof tempIdLookup[msg.id] !== 'undefined') {
					msg.id = tempIdLookup[msg.id];
				}
				//remove the polygon and notify other clients
				Level.removePolygonById(msg.id);
				GameConnectionServer.forEachSyncedExcept(conn, function(conn) {
					conn.bufferSend({
						messageType: 'delete-polygon',
						id: msg.id
					});
				});
				//TODO persist deleted state
			}
		});

		//if the client disconnects, we despawn their player entity
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
				handleCollisions(entities[i].sim, t);
			}
			for(i = 0; i < entities.length; i++) {
				entities[i].endOfFrame(t);
			}

			//every so often we send the updated state of all players on the server
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