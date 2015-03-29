define([
	'client/net/GameConnection',
	'client/Constants',
	'client/Clock',
	'client/entity/PhysBall',
	'shared/handleCollisions',
	'shared/level/Level'
], function(
	GameConnection,
	Constants,
	Clock,
	PhysBall,
	handleCollisions,
	Level
) {
	//set up entities
	var entities = [];
	var playableEntity = null;
	function getEntity(id) {
		for(var i = 0; i < entities.length; i++) {
			if(entities[i].entityId === id) {
				return entities[i];
			}
		}
		return null;
	}
	function spawnEntity(entity) {
		if(entity.type === 'PhysBall') {
			var ball = new PhysBall(entity.id, entity.state);
			entities.push(ball);
			return ball;
		}
		else {
			return null;
		}
	}
	function despawnEntity(id) {
		entities = entities.filter(function(entity) {
			return entity.entityId !== id;
		});
		if(playableEntity && playableEntity.entityId === id) {
			playableEntity = null;
		}
	}

	//set up level
	var level = new Level();

	GameConnection.on('receive', function(msg) {
		if(msg.messageType === 'game-state') {
			entities = [];
			msg.state.entities.forEach(spawnEntity);
			playableEntity = getEntity(msg.state.playableEntityId);
			if(playableEntity) {
				playableEntity.setPlayerControlled(true);
			}
			level.setState(msg.state.level);
		}
		else if(msg.messageType === 'entity-state-update') {
			getEntity(msg.entity.id).onStateUpdateFromServer(msg.entity.state);
		}
		else if(msg.messageType === 'spawn-entity') {
			spawnEntity(msg.entity);
		}
		else if(msg.messageType === 'despawn-entity') {
			despawnEntity(msg.entityId);
		}
		else if(msg.messageType === 'player-input') {
			getEntity(msg.entityId).onInputFromServer(msg.input, msg.details);
		}
	});

	return {
		reset: function() {
			entities = [];
		},
		tick: function(t) {
			for(var i = 0; i < entities.length; i++) {
				entities[i].tick(t);
				handleCollisions(entities[i].sim, level, t);
				handleCollisions(entities[i].serverSim, level, t);
			}
		},
		render: function(ctx) {
			var camera = {
				x: (playableEntity ? playableEntity.sim.pos.x - Constants.CANVAS_WIDTH / 2 : 0),
				y: (playableEntity ? playableEntity.sim.pos.y - Constants.CANVAS_HEIGHT / 2 : 0)
			};
			if(GameConnection.isConnected() && GameConnection.isSynced()) {
				if(Clock.speed > 1.0) { ctx.fillStyle = '#df0'; } //greener -- sped up
				else if(Clock.speed < 1.0) { ctx.fillStyle = '#fd0'; } //redder -- slowed down
				else { ctx.fillStyle = '#ff0'; } //yellow -- normal speed
			}
			else if(GameConnection.isConnected()) { ctx.fillStyle = '#f0f'; } //magenta -- syncing
			else { ctx.fillStyle = '#000'; } //black -- not connected
			ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);

			//render level
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			for(var i = 0; i < level.polygons.length; i++) {
				var points = level.polygons[i].points;
				ctx.beginPath();
				ctx.moveTo(points[points.length - 2] - camera.x, points[points.length - 1] - camera.y);
				for(var j = 0; j < points.length - 1; j += 2) {
					ctx.lineTo(points[j] - camera.x, points[j+1] - camera.y);
				}
				ctx.stroke();
			}

			//render entities
			for(i = 0; i < entities.length; i++) {
				entities[i].render(ctx, camera);
			}
		},
		onMouseEvent: function(evt) {
			if(playableEntity) {
				playableEntity.onMouseEvent(evt);
			}
		},
		onKeyboardEvent: function(evt, keyboard) {
			if(playableEntity) {
				playableEntity.onKeyboardEvent(evt, keyboard);
			}
		}
	};
});