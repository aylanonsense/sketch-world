define([
	'shared/utils/EventHelper'
], function(
	EventHelper
) {
	var points = [];
	var mousePos = { x: 0, y: 0 };
	var events = new EventHelper([ 'define-shape' ]);
	
	return {
		onMouseEvent: function(evt, camera) {
			var x = evt.x + camera.x, y = evt.y + camera.y;
			mousePos.x = x;
			mousePos.y = y;
			if(evt.type === 'mousedown') {
				//if you click close to the shape's start point it will close it off
				var dx = points[0] - x;
				var dy = points[1] - y;
				if(dx * dx + dy * dy < 5 * 5) {
					events.trigger('define-shape', {
						points: points
					});
					points = [];
				}
				//otherwise clicking will add more points to the shape
				else {
					points.push(x);
					points.push(y);
				}
			}
		},
		render: function(ctx, camera) {
			if(points.length > 1) {
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(points[0] - camera.x, points[1] - camera.y);
				for(var i = 2; i < points.length - 1; i += 2) {
					ctx.lineTo(points[i] - camera.x, points[i + 1] - camera.y);
				}
				ctx.lineTo(mousePos.x - camera.x, mousePos.y - camera.y);
				ctx.stroke();
			}
		},
		on: function(eventName, callback) {
			events.on(eventName, callback);
		}
	};
});