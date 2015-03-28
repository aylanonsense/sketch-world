define([
	'shared/level/geometry/LevelGeom',
	'shared/math/Vector',
	'shared/math/Utils'
], function(
	SUPERCLASS,
	Vector,
	MathUtils
) {
	var ERROR_ALLOWED = 0.3;
	function Point(x, y) {
		SUPERCLASS.call(this, 'Point');
		this.pos = new Vector(x, y);
	}
	Point.prototype = Object.create(SUPERCLASS.prototype);
	Point.prototype.checkForCollision = function(entity) {
		return this._checkForCollisionWithMovingCircle(entity.pos,
			entity.prevPos, entity.vel, entity.radius, 0.0001);
	};
	Point.prototype._checkForCollisionWithMovingCircle = function(pos, prevPos, vel, radius, bounceAmt) {
		//if the circle started out inside of the point, we need to push it out
		if(prevPos.squareDistance(this.pos) < radius * radius) {
			var lineToPrevPos = this.pos.createVectorTo(prevPos);
			lineToPrevPos.setLength(radius + 0.01);
			prevPos = this.pos.clone().add(lineToPrevPos);
		}

		//we have a utility method that finds us the interseciton between a circle and line
		var contactPoint = MathUtils.findCircleLineIntersection(this.pos, radius, prevPos, pos);
		if(contactPoint) {
			//there definitely is a collision here
			var lineToContactPoint = prevPos.createVectorTo(contactPoint);
			var distTraveled = lineToContactPoint.length();
			var lineOfMovement = prevPos.createVectorTo(pos);
			var totalDist = lineOfMovement.length();

			//now we figure out the angle of contact, so we can bounce the circle off of the point
			var lineFromPointToContactPoint = this.pos.createVectorTo(contactPoint);
			var angle = lineFromPointToContactPoint.angle();
			var cosAngle = Math.cos(angle), sinAngle = Math.sin(angle);

			//calculate the final position
			var distToTravel = totalDist - distTraveled;
			var movementPostContact = lineOfMovement.clone()
				.setLength(distToTravel).unrotate(cosAngle, sinAngle);
			if(movementPostContact.x < 0) {
				movementPostContact.x *= -bounceAmt;
			}
			movementPostContact.rotate(cosAngle, sinAngle);
			var finalPoint = contactPoint.clone().add(movementPostContact);

			//calculate the final velocity
			var finalVel = vel.clone().unrotate(cosAngle, sinAngle);
			if(finalVel.x < 0) {
				finalVel.x *= -bounceAmt;
			}
			finalVel.rotate(cosAngle, sinAngle);

			return {
				cause: this,
				collidableRadius: radius,
				distTraveled: distTraveled,
				distToTravel: distToTravel,
				contactPoint: contactPoint,
				vectorTowards: new Vector(-Math.cos(angle), -Math.sin(angle)),
				stabilityAngle: null,
				finalPoint: finalPoint,
				jumpVector: (this.jumpable ? MathUtils.createJumpVector(angle) : null),
				finalVel: finalVel
			};
		}

		//otherwise there is no collision
		return false;
	};
	return Point;
});