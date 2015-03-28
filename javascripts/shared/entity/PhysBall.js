define([
	'shared/math/Vector'
], function(
	Vector
) {
	var MOVE_SPEED = 200;
	function PhysBall(state) {
		this.pos = new Vector(0, 0);
		this.prevPos = new Vector(0, 0);
		this.vel = new Vector(0, 0);
		this.radius = 25;
		this.setState(state);
	}
	PhysBall.prototype.getState = function() {
		return {
			pos: this.pos.toObject(),
			prevPos: this.prevPos.toObject(),
			vel: this.vel.toObject(),
			radius: radius
		};
	};
	PhysBall.prototype.setState = function(state) {
		this.pos.copy(state.pos);
		this.prevPos.copy(state.prevPos);
		this.vel.copy(state.vel);
		this.radius = state.radius;
	};
	PhysBall.prototype.onInput = function(input, details) {
		/*if(input === 'set-waypoint') {
			this.waypointX = details.x;
			this.waypointY = details.y;
			if(details.moveX !== null) {
				this.waypointMoveDirX = details.moveX;
			}
			if(details.moveY !== null) {
				this.waypointMoveDirY = details.moveY;
			}
		}*/
	};
	PhysBall.prototype.tick = function(t) {
		this.prevPos.copy(this.pos);
		var oldVel = vel.clone();
		pos.add(t * (vel.x + oldVel.x) / 2, t * (vel.x + oldVel.x) / 2);
	};
	return PhysBall;
});