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
		this.moveDir = new Vector(0, 0);
		this.radius = 25;
		if(state) {
			this.setState(state);
		}
	}
	PhysBall.prototype.getState = function() {
		return {
			pos: this.pos.toObject(),
			prevPos: this.prevPos.toObject(),
			vel: this.vel.toObject(),
			moveDir: this.moveDir.toObject(),
			radius: this.radius
		};
	};
	PhysBall.prototype.setState = function(state) {
		this.pos.set(state.pos);
		this.prevPos.set(state.prevPos);
		this.vel.set(state.vel);
		this.moveDir.set(state.moveDir);
		this.radius = state.radius;
	};
	PhysBall.prototype.onInput = function(input, details) {
		if(input === 'set-move-dir') {
			this.moveDir.set(details.x, details.y);
		}
	};
	PhysBall.prototype.tick = function(t) {
		this.prevPos.set(this.pos);
		var oldVel = this.vel.clone();
		this.vel.add(this.moveDir.x * MOVE_SPEED * t, this.moveDir.y * MOVE_SPEED * t);
		this.pos.add(t * (this.vel.x + oldVel.x) / 2, t * (this.vel.y + oldVel.y) / 2);
	};
	return PhysBall;
});