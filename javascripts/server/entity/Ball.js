define([
	'shared/entity/Ball'
], function(
	BallSim
) {
	var nextEntityId = 0;
	function Ball(x, y) {
		this.entityId = nextEntityId++;
		this._sim = new BallSim({
			x: x,
			y: y,
			radius: 25,
			color: '#90f',
			targetX: null,
			targetY: null,
			targetMoveDirX: null,
			targetMoveDirY: null
		});
	}
	Ball.prototype.getState = function(state) {
		return {
			id: this.entityId,
			type: 'Ball',
			state: this._sim.getState()
		};
	};
	Ball.prototype.tick = function(t) {
		this._sim.tick(t);
	};
	return Ball;
});