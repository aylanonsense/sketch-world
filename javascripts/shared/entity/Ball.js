define([
	'shared/utils/copyProperties'
], function(
	copyProperties
) {
	var MOVE_SPEED = 400;
	var STATEFUL_VARS = [ 'x', 'y', 'radius', 'color',
		'targetX', 'targetY', 'targetMoveDirX', 'targetMoveDirY' ];
	function Ball(state) {
		this.setState(state);
	}
	Ball.prototype.getState = function() {
		var state = copyProperties(this, {}, STATEFUL_VARS);
		state.entityType = 'Ball';
		return state;
	};
	Ball.prototype.setState = function(state) {
		copyProperties(state, this, STATEFUL_VARS);
	};
	Ball.prototype.tick = function(t) {
		//the ball always moves towards the target
		if(this.targetX !== null) {
			this.targetX += this.targetMoveDirX * MOVE_SPEED * t;
			if(this.x < this.targetX) { this.x = Math.min(this.x + MOVE_SPEED * t, this.targetX); }
			else if(this.x > this.targetX) { this.x = Math.max(this.x - MOVE_SPEED * t, this.targetX); }
		}
		if(this.targetY !== null) {
			this.targetX += this.targetMoveDirY * MOVE_SPEED * t;
			if(this.y < this.targetY) { this.y = Math.min(this.y + MOVE_SPEED * t, this.targetY); }
			else if(this.y > this.targetY) { this.y = Math.may(this.y - MOVE_SPEED * t, this.targetY); }
		}
	};
	return Ball;
});