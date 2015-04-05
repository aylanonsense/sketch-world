define([
	'client/Constants',
	'shared/utils/EventHelper',
	'shared/math/Utils',
	'shared/math/Vector',
	'client/display/Sprite'
], function(
	Constants,
	EventHelper,
	MathUtils,
	Vector,
	Sprite
) {
	var SPRITE = new Sprite('BuildModeButtons');
	var currentMode = 'draw-polys';
	var isToggledOn = true;
	var level = null;
	var buttons = [
		{ frame: 0, mode: 'manipulate' },
		{ frame: 1, mode: 'draw-polys' },
		{ frame: 2, mode: 'doodle'}
	];
	var events = new EventHelper([ 'draw-poly', 'modify-poly' ]);

	//manipulate mode
	var MIN_DRAG_DISTANCE = 5;
	var selectedPolygon = null;
	var isDraggingSelectedPolygon = false;
	var selectedPolygonDragOffset = null;

	//draw-polys mode
	var DRAW_POLYS_SNAP_DISTANCE = 7;
	var mouseCanvasPos = { x: 0, y: 0 };
	var mousePos = { x: 0, y: 0 };
	var snappedMousePos = { x: 0, y: 0 };
	var polyPoints = [];
	var polyLines = [];

	//position buttons
	var buttonDownIndex = null;
	var hoverButtonIndex = null;
	var spacing = 5;
	var buttonWidth = 30;
	var buttonHeight = 30;
	var paneWidth = spacing + (spacing + buttonWidth) * buttons.length;
	var paneHeight = buttonHeight + spacing * 2;
	var paneX = Constants.CANVAS_WIDTH / 2 - paneWidth / 2;
	var paneY = Constants.CANVAS_HEIGHT - paneHeight;
	for(var i = 0; i < buttons.length; i++) {
		buttons[i].x = paneX + spacing + (spacing + buttonWidth) * i;
		buttons[i].y = paneY + spacing;
		buttons[i].width = 30;
		buttons[i].height = 30;
	}

	function switchToMode(mode) {
		if(currentMode !== mode) {
			currentMode = mode;
			selectedPolygon = null;
			isDraggingSelectedPolygon = false;
			selectedPolygonDragOffset = null;
			polyPoints = [];
			polyLines = [];
		}
	}

	function addPolyLineTo(x, y) {
		if(polyPoints.length > 0) {
			var line = {
				start: new Vector(polyPoints[polyPoints.length - 2],
								polyPoints[polyPoints.length - 1]),
				end: new Vector(x, y)
			};

			//check to see if the new point would make any lines that cross (bad)
			for(var i = 0; i < polyLines.length; i++) {
				if(MathUtils.linesAreCrossing(polyLines[i], line, i === 0, i === polyLines.length - 1)) {
					return false;
				}
			}

			//otherwise, we're free to add the new point
			polyLines.push(line);
		}
		return true;
	}

	function drawOffsetNumbers(ctx, camera, x, y) {
		ctx.fillStyle = '#000';
		ctx.font = "10px Arial";
		if(x !== 0) {
			if(x > 0) {
				ctx.fillText("+" + x, mousePos.x - camera.x + 10, mousePos.y - camera.y + 5);
			}
			else {
				ctx.fillText("" + x, mousePos.x - camera.x - 30, mousePos.y - camera.y + 5);
			}
		}
		if(y !== 0) {
			if(y > 0) {
				ctx.fillText("-" + y, mousePos.x - camera.x - 10, mousePos.y - camera.y + 25);
			}
			else {
				ctx.fillText("+" + (-y), mousePos.x - camera.x - 10, mousePos.y - camera.y - 15);
			}
		}
	}

	function snapMousePos() {
		snappedMousePos.x = Math.round(mousePos.x);
		snappedMousePos.y = Math.round(mousePos.y);
		if(currentMode === 'draw-polys') {
			//snap mouse pos to starting point (if it's near it)
			var dx = mousePos.x - polyPoints[0];
			var dy = mousePos.y - polyPoints[1];
			if(dx * dx + dy * dy < DRAW_POLYS_SNAP_DISTANCE * DRAW_POLYS_SNAP_DISTANCE) {
				snappedMousePos.x = polyPoints[0];
				snappedMousePos.y = polyPoints[1];
			}
		}
	}

	function finalizePoly() {
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
		setLevel: function(lvl) {
			level = lvl;
		},
		isOn: function() {
			return isToggledOn;
		},
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		reset: function() {
			currentMode = 'draw-polys';
			isToggledOn = true;
			level = null;
			selectedPolygon = null;
			isDraggingSelectedPolygon = false;
			selectedPolygonDragOffset = null;
			polyPoints = [];
			polyLines = [];
		},
		toggle: function() {
			isToggledOn = !isToggledOn;
			if(!isToggledOn) {
				polyPoints = [];
			}
		},
		onMouseEvent: function(evt, camera) {
			mouseCanvasPos.x = evt.x;
			mouseCanvasPos.y = evt.y;
			mousePos.x = evt.x + camera.x;
			mousePos.y = evt.y + camera.y;
			snappedMousePos.x = Math.round(mousePos.x);
			snappedMousePos.y = Math.round(mousePos.y);

			//we might be hovering over / pressing a mode-change button
			for(var i = 0; i < buttons.length; i++) {
				if(buttons[i].x <= evt.x && evt.x <= buttons[i].x + buttons[i].width &&
					buttons[i].y <= evt.y && evt.y <= buttons[i].y + buttons[i].height) {
					if(evt.type === 'mousedown') {
						buttonDownIndex = i;
					}
					else if(evt.type === 'mouseup') {
						if(buttonDownIndex === i) {
							//clicked!
							buttonDownIndex = null;
							switchToMode(buttons[i].mode);
						}
					}
					else if(evt.type === 'mousemove') {
						hoverButtonIndex = i;
					}
					return;
				}
			}
			if(evt.type === 'mouseup') {
				buttonDownIndex = null;
			}
			hoverButtonIndex = null;

			//if we're in draw-polys mode, we want to add points to a polygon
			if(currentMode === 'draw-polys') {
				snapMousePos();
				if(evt.type === 'mousedown') {
					//if the new point doesn't create a line that intersects its other lines...
					if(addPolyLineTo(snappedMousePos.x, snappedMousePos.y)) {
						//this might mean "finishing off" the polygon
						if(snappedMousePos.x === polyPoints[0] && snappedMousePos.y === polyPoints[1]) {
							finalizePoly();
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

			//if we're in manipulate mode, we want to select polys
			else if(currentMode === 'manipulate') {
				if(level !== null) {
					//might be selecting a polygon
					if(evt.type === 'mousedown') {
						for(i = 0; i < level.polygons.length; i++) {
							if(level.polygons[i].containsPoint(snappedMousePos.x, snappedMousePos.y)) {
								selectedPolygon = level.polygons[i];
								selectedPolygonDragOffset = { x: mousePos.x, y: mousePos.y };
								return;
							}
						}
						selectedPolygon = null;
						isDraggingSelectedPolygon = false;
						selectedPolygonDragOffset = null;
					}
					else if(evt.type === 'mousemove') {
						if(selectedPolygon && selectedPolygonDragOffset && !isDraggingSelectedPolygon) {
							var dx = mousePos.x - selectedPolygonDragOffset.x;
							var dy = mousePos.y - selectedPolygonDragOffset.y;
							if(dx * dx + dy * dy > MIN_DRAG_DISTANCE * MIN_DRAG_DISTANCE) {
								isDraggingSelectedPolygon = true;
							}
						}
					}
					else if(evt.type === 'mouseup') {
						if(isDraggingSelectedPolygon) {
							for(i = 0; i < selectedPolygon.points.length - 1; i += 2) {
								selectedPolygon.points[i] += mousePos.x - selectedPolygonDragOffset.x;
								selectedPolygon.points[i + 1] += mousePos.y - selectedPolygonDragOffset.y;
							}
							selectedPolygon.recalculateGeometry();
							events.trigger('modify-poly', selectedPolygon);
						}
						isDraggingSelectedPolygon = false;
						selectedPolygonDragOffset = null;
					}
				}
			}
		},
		onKeyboardEvent: function(evt, keyboard) {
			if(evt.key === 'BUILD_MODE_1' && evt.isDown) {
				switchToMode('manipulate');
			}
			else if(evt.key === 'BUILD_MODE_2' && evt.isDown) {
				switchToMode('draw-polys');
			}
			else if(evt.key === 'BUILD_MODE_3' && evt.isDown) {
				switchToMode('doodle');
			}
		},
		render: function(ctx, camera) {
			mousePos.x = mouseCanvasPos.x + camera.x;
			mousePos.y = mouseCanvasPos.y + camera.y;
			snapMousePos();
			var i;
			if(isToggledOn) {
				//draw pane
				ctx.fillStyle = '#fff';
				ctx.fillRect(paneX, paneY, paneWidth, paneHeight);

				//if we're in draw-polys mode we want to draw a series of lines
				if(currentMode === 'draw-polys' && polyPoints.length > 0) {
					ctx.strokeStyle = '#000';
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(polyPoints[0] - camera.x, polyPoints[1] - camera.y);
					for(i = 2; i < polyPoints.length - 1; i += 2) {
						ctx.lineTo(polyPoints[i] - camera.x, polyPoints[i + 1] - camera.y);
					}
					ctx.stroke();

					//draw rule to where the next point will be placed
					ctx.strokeStyle = '#900';
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(polyPoints[polyPoints.length - 2] - camera.x, polyPoints[polyPoints.length - 1] - camera.y);
					ctx.lineTo(snappedMousePos.x - camera.x, snappedMousePos.y - camera.y);
					ctx.stroke();
					if(snappedMousePos.x === polyPoints[0] && snappedMousePos.y === polyPoints[1]) {
						ctx.beginPath();
						ctx.arc(polyPoints[0] - camera.x, polyPoints[1] - camera.y, 5, 0, 2 * Math.PI);
						ctx.stroke();
					}

					//draw relative point position text
					dx = snappedMousePos.x - polyPoints[polyPoints.length - 2];
					dy = snappedMousePos.y - polyPoints[polyPoints.length - 1];
					drawOffsetNumbers(ctx, camera, dx, dy);
				}

				//draw buttons
				for(i = 0; i < buttons.length; i++) {
					var frame = buttons[i].frame;
					if(currentMode === buttons[i].mode) {
						frame += (hoverButtonIndex === i ? 4 * 6 : 5 * 6);
					}
					else if(buttonDownIndex === i) {
						frame += (hoverButtonIndex === i ? 2 * 6 : 3 * 6);
					}
					else {
						frame += (hoverButtonIndex === i ? 0 * 6 : 1 * 6);
					}
					SPRITE.render(ctx, null, buttons[i].x, buttons[i].y, frame, false);
				}

				//draw selected polygon
				if(selectedPolygon) {
					var minX = selectedPolygon.minX, maxX = selectedPolygon.maxX,
						minY = selectedPolygon.minY, maxY = selectedPolygon.maxY;
					ctx.strokeStyle = '#06f';
					ctx.lineWidth = 1;
					ctx.strokeRect(minX - 2 - 3 - camera.x, minY - 2 - 3 - camera.y, 6, 6);
					ctx.strokeRect(maxX + 2 - 3 - camera.x, minY - 2 - 3 - camera.y, 6, 6);
					ctx.strokeRect(maxX + 2 - 3 - camera.x, maxY + 2 - 3 - camera.y, 6, 6);
					ctx.strokeRect(minX - 2 - 3 - camera.x, maxY + 2 - 3 - camera.y, 6, 6);
					ctx.beginPath();
					ctx.moveTo(minX - 2 + 3 - camera.x, minY - 2 + 0 - camera.y);
					ctx.lineTo(maxX + 2 - 3 - camera.x, minY - 2 + 0 - camera.y);
					ctx.moveTo(maxX + 2 + 0 - camera.x, minY - 2 + 3 - camera.y);
					ctx.lineTo(maxX + 2 + 0 - camera.x, maxY + 2 - 3 - camera.y);
					ctx.moveTo(maxX + 2 - 3 - camera.x, maxY + 2 + 0 - camera.y);
					ctx.lineTo(minX - 2 + 3 - camera.x, maxY + 2 + 0 - camera.y);
					ctx.moveTo(minX - 2 + 0 - camera.x, maxY + 2 - 3 - camera.y);
					ctx.lineTo(minX - 2 + 0 - camera.x, minY - 2 + 3 - camera.y);
					ctx.moveTo((minX + maxX) / 2 - 5 - camera.x, (minY + maxY) / 2 - camera.y);
					ctx.lineTo((minX + maxX) / 2 + 5 - camera.x, (minY + maxY) / 2 - camera.y);
					ctx.moveTo((minX + maxX) / 2 - camera.x, (minY + maxY) / 2 - 5 - camera.y);
					ctx.lineTo((minX + maxX) / 2 - camera.x, (minY + maxY) / 2 + 5 - camera.y);
					ctx.stroke();

					//if we're dragging the polygon, we want to draw an outline of it
					if(isDraggingSelectedPolygon) {
						ctx.strokeStyle = '#f00';
						ctx.lineWidth = 5;
						ctx.beginPath();
						for(i = 0; i < selectedPolygon.points.length - 1; i += 2) {
							ctx[i === 0 ? 'moveTo' : 'lineTo'](selectedPolygon.points[i] - camera.x - selectedPolygonDragOffset.x + mousePos.x,
									selectedPolygon.points[i + 1] - camera.y - selectedPolygonDragOffset.y + mousePos.y);
						}
						ctx.closePath();
						ctx.stroke();
						drawOffsetNumbers(ctx, camera, mousePos.x - selectedPolygonDragOffset.x, mousePos.y - selectedPolygonDragOffset.y);
					}
				}
			}
		}
	};
});