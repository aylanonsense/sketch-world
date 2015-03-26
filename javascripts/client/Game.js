define([
	'client/net/GameConnection',
	'client/Constants',
	'client/Clock',
	'client/entity/Ball'
], function(
	GameConnection,
	Constants,
	Clock,
	Ball
) {
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

	GameConnection.on('receive', function(msg) {
		// console.log("Received:", msg);
		if(msg.messageType === 'game-state') {
			entities = msg.state.entities.map(function(entity) {
				if(entity.type === 'Ball') {
					return new Ball(entity.id, entity.state);
				}
				else {
					return null;
				}
			});
		}
		else if(msg.messageType === 'grant-entity-ownership') {
			playableEntity = getEntity(msg.entityId);
		}
	});

	return {
		reset: function() {
			entities = [];
		},
		tick: function(t) {
			for(var i = 0; i < entities.length; i++) {
				entities[i].tick(t);
			}
		},
		render: function(ctx) {
			if(GameConnection.isConnected() && GameConnection.isSynced()) {
				if(Clock.speed > 1.0) {
					ctx.fillStyle = '#0f0'; //green -- sped up
				}
				else if(Clock.speed < 1.0) {
					ctx.fillStyle = '#f00'; //red -- slowed down
				}
				else {
					ctx.fillStyle = '#ff0'; //yellow -- normal speed
				}
			}
			else if(GameConnection.isConnected()) {
				ctx.fillStyle = '#f0f'; //magenta -- syncing
			}
			else {
				ctx.fillStyle = '#000'; //black -- not connected
			}
			ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);

			//render entities
			for(var i = 0; i < entities.length; i++) {
				entities[i].render(ctx, { x: 0, y: 0 });
			}
		},
		onMouseEvent: function(evt) {},
		onKeyboardEvent: function(evt, keyboard) {
			if(playableEntity) {
				if(evt.key === 'MOVE_LEFT') {
					playableEntity.setMoveDirX(evt.isDown ? -1 : (keyboard.MOVE_RIGHT ? 1 : 0));
				}
				else if(evt.key === 'MOVE_RIGHT') {
					playableEntity.setMoveDirX(evt.isDown ? 1 : (keyboard.MOVE_LEFT ? -1 : 0));
				}
				else if(evt.key === 'MOVE_UP') {
					playableEntity.setMoveDirY(evt.isDown ? -1 : (keyboard.MOVE_DOWN ? 1 : 0));
				}
				else if(evt.key === 'MOVE_DOWN') {
					playableEntity.setMoveDirY(evt.isDown ? 1 : (keyboard.MOVE_UP ? -1 : 0));
				}
			}
		}
	};
});