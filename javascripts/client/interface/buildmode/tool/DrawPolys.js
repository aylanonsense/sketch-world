define([
	'shared/utils/EventHelper',
	'shared/math/Vector',
	'shared/math/Utils'
], function(
	EventHelper,
	Vector,
	MathUtils
) {
	var SNAP_DIST = 7;
	var mousePos = { x: 0, y: 0 };
	var polyPoints = [];
	var polyLines = [];
	var events = new EventHelper([ 'draw-poly' ]);

	function findValidLineToPoint(x, y) {
		if(polyPoints.length > 0) {
			var line = {
				start: new Vector(polyPoints[polyPoints.length - 2],
								polyPoints[polyPoints.length - 1]),
				end: new Vector(x, y)
			};

			//check to see if the new point would make any lines that cross (bad)
			for(var i = 0; i < polyLines.length; i++) {
				if(MathUtils.linesAreCrossing(polyLines[i], line, i === 0, i === polyLines.length - 1)) {
					return null;
				}
			}

			//otherwise, we're free to add the new point
			return line;
		}
		return null;
	}

	function drawOffsetNumbers(ctx, camera, x, y) {
		ctx.fillStyle = '#000';
		ctx.font = "10px Arial";
		if(x !== 0) {
			if(x > 0) {
				ctx.fillText("+" + x, mousePos.x + 10, mousePos.y + 5);
			}
			else {
				ctx.fillText("" + x, mousePos.x - 30, mousePos.y + 5);
			}
		}
		if(y !== 0) {
			if(y > 0) {
				ctx.fillText("-" + y, mousePos.x - 10, mousePos.y + 25);
			}
			else {
				ctx.fillText("+" + (-y), mousePos.x - 10, mousePos.y - 15);
			}
		}
	}

	function snapMousePos(camera) {
		var snappedMousePos = {
			x: Math.round(mousePos.x + camera.x),
			y: Math.round(mousePos.y + camera.y)
		};
		//snap mouse pos to starting point (if it's near it)
		var dx = snappedMousePos.x - polyPoints[0];
		var dy = snappedMousePos.y - polyPoints[1];
		if(dx * dx + dy * dy < SNAP_DIST * SNAP_DIST) {
			snappedMousePos.x = polyPoints[0];
			snappedMousePos.y = polyPoints[1];
		}
		return snappedMousePos;
	}

	function finishPoly() {
		//we might need to "reverse" the list of points so that it's clockwise
		var doubleArea = 0;
		for(var i = 0; i < polyPoints.length - 1; i += 2) {
			doubleArea += (polyPoints[(i + 2) % polyPoints.length] - polyPoints[i]) *
				(polyPoints[i + 1] + polyPoints[(i + 3) % polyPoints.length]);
		}
		if(doubleArea === 0) {
			//if we just made a line with no area, we throw it out (do nothing)
		}
		else if(doubleArea < 0) {
			//points do not need to be reversed
			events.trigger('draw-poly', { points: polyPoints });
		}
		else {
			//points do need to be reversed
			var reversedPolyPoints = [];
			for(i = polyPoints.length - 2; i >= 0; i -= 2) {
				reversedPolyPoints.push(polyPoints[i]);
				reversedPolyPoints.push(polyPoints[i + 1]);
			}
			events.trigger('draw-poly', { points: reversedPolyPoints });
		}
	}

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		reset: function() {
			polyPoints = [];
			polyLines = [];
		},
		onMouseEvent: function(evt, camera) {
			mousePos.x = evt.x;
			mousePos.y = evt.y;
			var snappedMousePos = snapMousePos(camera);

			//if we're in draw-polys mode, we want to add points to a polygon
			if(evt.type === 'mousedown') {
				///our first point is simple -- we just add it.
				if(polyPoints.length < 2) {
					polyPoints.push(snappedMousePos.x);
					polyPoints.push(snappedMousePos.y);
				}
				else {
					//if the new point doesn't create a line that intersects its other lines...
					var line = findValidLineToPoint(snappedMousePos.x, snappedMousePos.y);
					if(line) {
						polyLines.push(line);
						//this might mean "finishing off" the polygon
						if(snappedMousePos.x === polyPoints[0] && snappedMousePos.y === polyPoints[1]) {
							finishPoly();
							polyPoints = [];
							polyLines = [];
						}
						//or just adding an additional point to it
						else {
							polyPoints.push(snappedMousePos.x);
							polyPoints.push(snappedMousePos.y);
						}
					}
				}
			}
		},
		onKeyboardEvent: function(evt, keyboard) {},
		render: function(ctx, camera) {
			var snappedMousePos = snapMousePos(camera);

			//if we're in draw-polys mode we want to draw a series of lines
			if(polyPoints.length > 0) {
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 2;
				ctx.beginPath();
				for(i = 0; i < polyPoints.length - 1; i += 2) {
					ctx[i === 0 ? 'moveTo' : 'lineTo'](polyPoints[i] - camera.x,
						polyPoints[i + 1] - camera.y);
				}
				ctx.stroke();

				//draw rule to where the next point will be placed
				ctx.strokeStyle = '#900';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(polyPoints[polyPoints.length - 2] - camera.x,
					polyPoints[polyPoints.length - 1] - camera.y);
				ctx.lineTo(snappedMousePos.x - camera.x, snappedMousePos.y - camera.y);
				ctx.stroke();
				if(snappedMousePos.x === polyPoints[0] && snappedMousePos.y === polyPoints[1]) {
					ctx.beginPath();
					ctx.arc(polyPoints[0] - camera.x, polyPoints[1] - camera.y, 5, 0, 2 * Math.PI);
					ctx.stroke();
				}

				//draw relative point position text
				drawOffsetNumbers(ctx, camera, snappedMousePos.x - polyPoints[polyPoints.length - 2],
					snappedMousePos.y - polyPoints[polyPoints.length - 1]);
			}
		}
	};
});