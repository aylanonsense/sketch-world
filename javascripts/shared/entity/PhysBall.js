define([
	'shared/math/Vector',
	'shared/Constants'
], function(
	Vector,
	SharedConstants
) {
	var MOVE_SPEED = 200;
	var MIN_DIST_PER_COLLISION_PER_SECOND = 10;
	var JUMP_BUFFER_FRAMES = 5;
	var JUMP_LENIANCE_FRAMES = 6;

	function PhysBall(state) {
		this.pos = new Vector(0, 0);
		this.prevPos = new Vector(0, 0);
		this.vel = new Vector(0, 0);
		this.moveDir = new Vector(0, 0);
		this.radius = 25;
		this.isAirborne = true;
		this.isOnTerraFirma = false;
		this.bufferedJumpTime = 0.0;
		this.endNextJumpImmediately = false;
		this.mostRecentJumpVector = new Vector(0, 0);
		this.timeSinceMostRecentJumpVector = 0.0;
		this.canJumpOffOfMostRecentJumpVector = false;
		this._collisionsThisFrame = [];
		this._numTerraFirmaCollisionsThisFrame = 0;
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
			isAirborne: this.isAirborne,
			isOnTerraFirma: this.isOnTerraFirma,
			bufferedJumpTime: this.bufferedJumpTime,
			endNextJumpImmediately: this.endNextJumpImmediately,
			mostRecentJumpVector: this.mostRecentJumpVector.toObject(),
			timeSinceMostRecentJumpVector: this.timeSinceMostRecentJumpVector,
			canJumpOffOfMostRecentJumpVector: this.canJumpOffOfMostRecentJumpVector
		};
	};
	PhysBall.prototype.setState = function(state) {
		this.pos.set(state.pos);
		this.prevPos.set(state.prevPos);
		this.vel.set(state.vel);
		this.moveDir.set(state.moveDir);
		this.radius = state.radius;
		this.isAirborne = state.isAirborne;
		this.isOnTerraFirma = state.isOnTerraFirma;
		this.bufferedJumpTime = state.bufferedJumpTime;
		this.endNextJumpImmediately = state.endNextJumpImmediately;
		this.mostRecentJumpVector.set(state.mostRecentJumpVector);
		this.timeSinceMostRecentJumpVector = state.timeSinceMostRecentJumpVector;
		this.canJumpOffOfMostRecentJumpVector = state.canJumpOffOfMostRecentJumpVector;
	};
	PhysBall.prototype.onInput = function(input, details) {
		if(input === 'set-move-dir') {
			this.moveDir.set(details.x, details.y);
		}
		else if(input === 'jump') {
			this.bufferedJumpTime = (JUMP_BUFFER_FRAMES + 0.5) / 60;
			this.endNextJumpImmediately = false;
		}
		else if(input === 'end-jump') {
			//TODO
		}
	};
	PhysBall.prototype.startOfFrame = function(t) {
		this._collisionsThisFrame = [];
		this._numTerraFirmaCollisionsThisFrame = 0;
	};
	PhysBall.prototype.tick = function(t) {
		this.prevPos.set(this.pos);
		var oldVel = this.vel.clone();
		this.vel.add(0, SharedConstants.PLAYER_PHYSICS.GRAVITY * t);

		//apply movement velocity
		var MOVEMENT;
		if(this.isAirborne) { MOVEMENT = SharedConstants.PLAYER_PHYSICS.AIR; }
		else if(!this.isOnTerraFirma) { MOVEMENT = SharedConstants.PLAYER_PHYSICS.SLIDING; }
		else { MOVEMENT = SharedConstants.PLAYER_PHYSICS.GROUND; }
		//moving REALLY FAST left/right...
		if(Math.abs(this.vel.x) > MOVEMENT.SOFT_MAX_SPEED) {
			this.vel.x = Math.max(-MOVEMENT.MAX_SPEED, Math.min(this.vel.x, MOVEMENT.MAX_SPEED));
			//trying to stop
			if(this.moveDir.x === 0) {
				if(this.vel.x > 0) { this.vel.x = Math.max(0, this.vel.x - MOVEMENT.SLOW_DOWN_ACC * t); }
				else { this.vel.x = Math.min(0, this.vel.x + MOVEMENT.SLOW_DOWN_ACC * t); }
			}
			//trying to maintain velocity
			else if(this.moveDir.x * this.vel.x > 0) {
				if(this.vel.x > 0) { this.vel.x = Math.max(MOVEMENT.SOFT_MAX_SPEED, this.vel.x - MOVEMENT.SLOW_DOWN_ACC * t); }
				else { this.vel.x = Math.min(-MOVEMENT.SOFT_MAX_SPEED, this.vel.x + MOVEMENT.SLOW_DOWN_ACC * t); }
			}
			//trying to turn around
			else {
				if(this.vel.x > 0) { this.vel.x = Math.max(-MOVEMENT.SOFT_MAX_SPEED, this.vel.x - MOVEMENT.TURN_AROUND_ACC * t); }
				else { this.vel.x = Math.min(MOVEMENT.SOFT_MAX_SPEED, this.vel.x + MOVEMENT.TURN_AROUND_ACC * t); }
			}
		}
		//moving left/right...
		else if(this.vel.x !== 0) {
			//trying to stop
			if(this.moveDir.x === 0) {
				if(this.vel.x > 0) { this.vel.x = Math.max(0, this.vel.x - MOVEMENT.SLOW_DOWN_ACC * t); }
				else { this.vel.x = Math.min(0, this.vel.x + MOVEMENT.SLOW_DOWN_ACC * t); }
			}
			//trying to speed up/slow down
			else {
				this.vel.x += this.moveDir.x * (this.moveDir.x * this.vel.x > 0 ?
					MOVEMENT.SPEED_UP_ACC : MOVEMENT.TURN_AROUND_ACC) * t;
				if(this.moveDir.x * this.vel.x > MOVEMENT.SOFT_MAX_SPEED) {
					this.vel.x = this.moveDir.x * MOVEMENT.SOFT_MAX_SPEED;
				}
			}
		}
		//stopped and starting to move
		else if(this.moveDir.x !== 0) {
			this.vel.x += this.moveDir.x * MOVEMENT.SPEED_UP_ACC * t;
			if(this.moveDir.x * this.vel.x > MOVEMENT.MAX_SPEED) {
				this.vel.x = this.moveDir.x * MOVEMENT.MAX_SPEED;
			}
		}

		//limit velocity to an absolute max
		this.vel.y = Math.max(-SharedConstants.PLAYER_PHYSICS.MAX_VERTICAL_SPEED,
			Math.min(this.vel.y, SharedConstants.PLAYER_PHYSICS.MAX_VERTICAL_SPEED));

		//apply velocity
		this.pos.add(t * (this.vel.x + oldVel.x) / 2, t * (this.vel.y + oldVel.y) / 2);
	};
	PhysBall.prototype.endOfFrame = function(t) {
		this.isAirborne = (this._collisionsThisFrame.length === 0);
		this.isOnTerraFirma = (this._numTerraFirmaCollisionsThisFrame > 0);

		//find the "best" jump surface this frame (the one that sends you them most upward/downward)
		var bestJumpVector = null;
		for(var i = 0; i < this._collisionsThisFrame.length; i++) {
			if(this._collisionsThisFrame[i].jumpVector && (bestJumpVector === null ||
				Math.abs(this._collisionsThisFrame[i].jumpVector.y) > Math.abs(bestJumpVector.y))) {
				bestJumpVector = this._collisionsThisFrame[i].jumpVector;
			}
		}

		//if we have a good jump candidate, we store it until we want to jump off of it
		if(bestJumpVector) {
			this.mostRecentJumpVector = bestJumpVector;
			this.timeSinceMostRecentJumpVector = 0.0;
			this.canJumpOffOfMostRecentJumpVector = true;
		}

		//we may even want to jump off of something right now!
		if(this.bufferedJumpTime > 0.0 && this.canJumpOffOfMostRecentJumpVector &&
			this.timeSinceMostRecentJumpVector < (JUMP_LENIANCE_FRAMES + 0.5) / 60) {
			this.vel.x += SharedConstants.PLAYER_PHYSICS.JUMP_SPEED * this.mostRecentJumpVector.x;
			var speed = (this.endNextJumpImmediately ? SharedConstants.PLAYER_PHYSICS.JUMP_BRAKE_SPEED :
				SharedConstants.PLAYER_PHYSICS.JUMP_SPEED);
			if(this.mostRecentJumpVector.y <= 0) {
				this.vel.y = Math.min(speed * this.mostRecentJumpVector.y, this.vel.y);
			}
			else {
				this.vel.y = Math.max(speed * this.mostRecentJumpVector.y, this.vel.y);
			}
			this.bufferedJumpTime = 0.0;
			this.endNextJumpImmediately = false;
			this.canJumpOffOfMostRecentJumpVector = false;
		}

		//adjust timers
		this.bufferedJumpTime = Math.max(0.0, this.bufferedJumpTime - t);
		this.timeSinceMostRecentJumpVector += t;
	};
	PhysBall.prototype.handleCollision = function(collision, t) {
		this._collisionsThisFrame.push(collision);
		this.pos.set(collision.finalPoint);
		this.prevPos.set(collision.contactPoint);
		this.vel.set(collision.finalVel);

		//we apply a sticky force because it... just makes the player stick to things better
		this.vel.add(collision.vectorTowards.clone().multiply(SharedConstants.PLAYER_PHYSICS.STICKY_FORCE));

		//relatively flat surfaces allow the player to stand on them
		var isTerraFirma = (collision.stabilityAngle !== null &&
			-Math.PI / 2 + SharedConstants.PLAYER_PHYSICS.STABILITY_ANGLE > collision.stabilityAngle &&
			-Math.PI / 2 - SharedConstants.PLAYER_PHYSICS.STABILITY_ANGLE < collision.stabilityAngle);
		if(isTerraFirma) {
			this._numTerraFirmaCollisionsThisFrame++;
			if(collision.counterGravityVector) {
				this.vel.add(collision.counterGravityVector.clone().
					multiply(SharedConstants.PLAYER_PHYSICS.GRAVITY * t));
			}
		}

		//if after the collision the player doesn't move much, we just stick them in place
		// (smoothes out some slidiness with slopes)
		if(this.isOnTerraFirma && collision.contactPoint.squareDistance(collision.finalPoint) <
			MIN_DIST_PER_COLLISION_PER_SECOND * t * MIN_DIST_PER_COLLISION_PER_SECOND * t) {
			this.pos.set(collision.contactPoint);
		}
	};
	return PhysBall;
});