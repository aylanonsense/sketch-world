define([
	'shared/utils/copyProperties'
], function(
	copyProperties
) {
	var MOVE_SPEED = 200;
	var STATEFUL_VARS = [ 'x', 'y', 'radius', 'color',
		'waypointX', 'waypointY', 'waypointMoveDirX', 'waypointMoveDirY' ];
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
	Ball.prototype.onInput = function(input, details) {
		if(input === 'set-waypoint') {
			this.waypointX = details.x;
			this.waypointY = details.y;
			if(details.moveX !== null) {
				this.waypointMoveDirX = details.moveX;
			}
			if(details.moveY !== null) {
				this.waypointMoveDirY = details.moveY;
			}
		}
	};
	Ball.prototype.tick = function(t) {
		//the ball always moves towards the waypoint
		if(this.waypointX !== null) {
			this.waypointX += this.waypointMoveDirX * MOVE_SPEED * t;
			if(this.x < this.waypointX) { this.x = Math.min(this.x + MOVE_SPEED * t, this.waypointX); }
			else if(this.x > this.waypointX) { this.x = Math.max(this.x - MOVE_SPEED * t, this.waypointX); }
		}
		if(this.waypointY !== null) {
			this.waypointY += this.waypointMoveDirY * MOVE_SPEED * t;
			if(this.y < this.waypointY) { this.y = Math.min(this.y + MOVE_SPEED * t, this.waypointY); }
			else if(this.y > this.waypointY) { this.y = Math.max(this.y - MOVE_SPEED * t, this.waypointY); }
		}
	};
	return Ball;
});