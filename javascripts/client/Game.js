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

	GameConnection.on('connect', function() {
		console.log("Connected!");
	});
	GameConnection.on('sync', function() {
		console.log("Synced!");
	});
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
	});
	GameConnection.on('disconnect', function() {
		console.log("Disconnected!");
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
		onKeyboardEvent: function(evt, keyboard) {}
	};
});