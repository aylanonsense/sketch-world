define([
	'shared/math/Vector',
	'shared/Constants'
], function(
	Vector,
	SharedConstants
) {
	var MOVE_SPEED = 200;
	function PhysBall(state) {
		this.pos = new Vector(0, 0);
		this.prevPos = new Vector(0, 0);
		this.vel = new Vector(0, 0);
		this.moveDir = new Vector(0, 0);
		this.radius = 25;
		this.isAirborne = true;
		this._collisionsThisFrame = 0;
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
			radius: this.radius,
			isAirborne: this.isAirborne
		};
	};
	PhysBall.prototype.setState = function(state) {
		this.pos.set(state.pos);
		this.prevPos.set(state.prevPos);
		this.vel.set(state.vel);
		this.moveDir.set(state.moveDir);
		this.radius = state.radius;
		this.isAirborne = state.isAirborne;
	};
	PhysBall.prototype.onInput = function(input, details) {
		if(input === 'set-move-dir') {
			this.moveDir.set(details.x, details.y);
		}
	};
	PhysBall.prototype.startOfFrame = function(t) {
		this._collisionsThisFrame = 0;
	};
	PhysBall.prototype.tick = function(t) {
		this.prevPos.set(this.pos);
		var oldVel = this.vel.clone();
		this.vel.add(this.moveDir.x * MOVE_SPEED * t, this.moveDir.y * MOVE_SPEED * t);
		this.vel.add(0, SharedConstants.PLAYER_PHYSICS.GRAVITY * t);
		this.pos.add(t * (this.vel.x + oldVel.x) / 2, t * (this.vel.y + oldVel.y) / 2);
	};
	PhysBall.prototype.endOfFrame = function(t) {
		this.isAirborne = (this._collisionsThisFrame === 0);
	};
	PhysBall.prototype.handleCollision = function(collision, t) {
		this.pos.set(collision.finalPoint);
		this.prevPos.set(collision.contactPoint);
		this.vel.set(collision.finalVel);
		this._collisionsThisFrame++;
		/*this.pos = collision.finalPoint;
		this.prevPos = collision.contactPoint;
		this.vel = collision.finalVel;
		this.isAirborne = false;
		this._isAirborneLastFrame = false;
		if(collision.cause.entityType === 'Grapple') {
			this._isGrapplingLastFrame = true;
			this._lastGrappleTouched = collision.cause;
		}
		this.isOnTerraFirma = (collision.stabilityAngle !== null &&
			-Math.PI / 2 + SharedConstants.PLAYER_PHYSICS.STABILITY_ANGLE > collision.stabilityAngle &&
			-Math.PI / 2 - SharedConstants.PLAYER_PHYSICS.STABILITY_ANGLE < collision.stabilityAngle);
		this.vel.add(collision.vectorTowards.clone().multiply(SharedConstants.PLAYER_PHYSICS.STICKY_FORCE));

		if(collision.counterGravityVector && this.isOnTerraFirma) {
			this.vel.add(collision.counterGravityVector.clone().
				multiply(SharedConstants.PLAYER_PHYSICS.GRAVITY * t));
		}

		if(this.isOnTerraFirma && collision.contactPoint.squareDistance(collision.finalPoint) <
			MIN_DIST_PER_COLLISION * t * MIN_DIST_PER_COLLISION * t) {
			this.pos = collision.contactPoint;
		}*/
	};
	return PhysBall;
});