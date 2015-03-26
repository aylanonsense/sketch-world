define([
	'shared/entity/Ball'
], function(
	BallSim
) {
	function Ball(id, state) {
		this.entityId = id;
		this._sim = new BallSim(state);
	}
	Ball.prototype.tick = function(t) {
		this._sim.tick(t);
	};
	Ball.prototype.render = function(ctx, camera) {
		ctx.fillStyle = this._sim.color;
		ctx.beginPath();
		ctx.arc(this._sim.x - camera.x, this._sim.y - camera.y, this._sim.radius, 0, 2 * Math.PI);
		ctx.fill();
	};
	return Ball;
});