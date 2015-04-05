define([
	'shared/math/Vector'
], function(
	Vector
) {
	return {
		createJumpVector: function(angle) {
			var distFromTop = (angle + Math.PI / 2) % (2 * Math.PI);
			if(distFromTop > Math.PI) {
				distFromTop = distFromTop - 2 * Math.PI;
			}
			var squareDistFromTop = distFromTop * distFromTop;
			var const1 = -0.9;
			var const2 = -const1 / Math.PI;
			angle = angle + const1 * distFromTop + const2 *
				(distFromTop > 0 ? 1 : -1) * squareDistFromTop;
			return new Vector(Math.cos(angle), Math.sin(angle));
		},
		linesAreCrossing: function(line1, line2, allowLine2ToTouchLine1End, allowLine1ToTouchLine2End) {
			var slope1 = line1.start.createVectorTo(line1.end);
			var slope2 = line2.start.createVectorTo(line2.end);
			var startDiff = line2.start.clone().subtract(line1.start);
			var t = startDiff.cross(slope2) / slope1.cross(slope2);
			var u = startDiff.cross(slope1) / slope1.cross(slope2);
			if(allowLine2ToTouchLine1End && t === 0 && u === 1) {
				return false;
			}
			if(allowLine1ToTouchLine2End && t === 1 && u === 0) {
				return false;
			}
			return 0 <= t && t <= 1 && 0 <= u && u <= 1;
		},
		findCircleLineIntersection: function(circleCenter, circleRadius, lineStart, lineEnd) {
			//calculate the discriminant
			var line = lineStart.createVectorTo(lineEnd);
			var vectorToCircle = lineStart.createVectorTo(circleCenter);
			var a = line.dot(line);
			var b = 2 * vectorToCircle.dot(line);
			var c = vectorToCircle.dot(vectorToCircle) - circleRadius * circleRadius;
			var discriminant = b * b - 4 * a * c;

			//we'll only have real roots if the discriminant is >= 0
			if(discriminant >= 0) {
				//we have two roots, the intersection is the one closest to the starting point
				discriminant = Math.sqrt(discriminant);
				var root1 = (-b - discriminant) / (2 * a);
				var root2 = (-b + discriminant) / (2 * a);
				var lineLength = line.length();
				var vectorToRoot1 = line.clone().setLength(lineLength * -root1);
				var vectorToRoot2 = line.clone().setLength(lineLength * -root2);
				var vectorToIntersection = (vectorToRoot1.squareLength() < vectorToRoot2.squareLength() ?
						vectorToRoot1 : vectorToRoot2);

				//the intersection is only valid if it's actually on the circle's path (not past it)
				var distToIntersection = line.dot(vectorToIntersection) / lineLength;
				if(0 <= distToIntersection && distToIntersection <= lineLength) {
					//yay, there definitely was an intersection!
					return lineStart.clone().add(vectorToIntersection);
				}
			}

			//otherwise there is no intersection
			return false;
		}
	};
});