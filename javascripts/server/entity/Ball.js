define([
	'shared/entity/Ball',
	'server/net/GameConnectionServer'
], function(
	BallSim,
	GameConnectionServer
) {
	var nextEntityId = 0;
	function Ball(x, y) {
		this.entityId = nextEntityId++;
		this._sim = new BallSim({
			x: x,
			y: y,
			radius: 25,
			color: '#90f',
			waypointX: null,
			waypointY: null,
			waypointMoveDirX: null,
			waypointMoveDirY: null
		});
	}
	Ball.prototype.getState = function(state) {
		return {
			id: this.entityId,
			type: 'Ball',
			state: this._sim.getState()
		};
	};
	Ball.prototype.onInputFromClient = function(input, details) {
		var self = this;
		this._sim.onInput(input, details);
		GameConnectionServer.forEach(function(conn) {
			conn.bufferSend({
				messageType: 'player-input',
				entityId: self.entityId,
				input: input,
				details: details
			});
		});
	};
	Ball.prototype.tick = function(t) {
		this._sim.tick(t);
	};
	return Ball;
});