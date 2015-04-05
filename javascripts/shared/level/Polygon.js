define([
	'shared/math/Utils',
	'shared/math/Vector',
	'shared/level/geometry/Point',
	'shared/level/geometry/Line'
], function(
	MathUtils,
	Vector,
	Point,
	Line
) {
	function Polygon(state) {
		this.id = null;
		this.tempId = null;
		this.points = [];
		this._geometry = [];
		this._edges = [];
		if(state) {
			this.setState(state);
		}
	}
	Polygon.prototype.getState = function() {
		return {
			id: this.id,
			tempId: this.tempId,
			points: this.points
		};
	};
	Polygon.prototype.setState = function(state) {
		this.id = state.id;
		this.tempId = state.tempId;
		this.points = state.points;
		this.recalculateGeometry();
	};
	Polygon.prototype.recalculateGeometry = function() {
		//create geometry (for colliding with the player)
		this._geometry = [];
		for(var i = 0; i < this.points.length - 1; i += 2) {
			this._geometry.push(new Point(this.points[i], this.points[i + 1]));
			this._geometry.push(new Line(this.points[i], this.points[i + 1],
				this.points[(i + 2) % this.points.length], this.points[(i + 3) % this.points.length]));
		}

		//create edges (for detecting clicks, etc)
		this._edges = [];
		for(i = 0; i < this.points.length - 1; i += 2) {
			this._edges.push({
				start: new Vector(this.points[i], this.points[i + 1]),
				end: new Vector(this.points[(i + 2) % this.points.length],
					this.points[(i + 3) % this.points.length])
			});
		}
	};
	Polygon.prototype.checkForCollision = function(entity) {
		var earliestCollision = null;
		for(var i = 0; i < this._geometry.length; i++) {
			var collision = this._geometry[i].checkForCollision(entity);
			if(collision && (!earliestCollision || collision.distTraveled < earliestCollision.distTraveled)) {
				earliestCollision = collision;
			}
		}
		return earliestCollision;
	};
	Polygon.prototype.containsPoint = function(x, y) {
		//we add a small amount to the y-value so ray doesn't overlap vertices
		var lineOutOfPoly = {
			start: new Vector(Math.round(x), Math.round(y) + 0.1234),
			end: new Vector(this.maxX + 999, Math.round(y) + 0.1234)
		};
		var crossings = 0;
		for(var i = 0; i < this._edges.length; i++) {
			if(MathUtils.linesAreCrossing(lineOutOfPoly, this._edges[i])) {
				crossings++;
			}
		}
		return (crossings % 2) === 1;
	};

	Object.defineProperties(Polygon.prototype, {
		minX: {
			get: function() {
				var minX = this.points[0];
				for(var i = 0; i < this.points.length - 1; i += 2) {
					minX = Math.min(minX, this.points[i]);
				}
				return minX;
			}
		},
		maxX: {
			get: function() {
				var maxX = this.points[0];
				for(var i = 0; i < this.points.length - 1; i += 2) {
					maxX = Math.max(maxX, this.points[i]);
				}
				return maxX;
			}
		},
		minY: {
			get: function() {
				var minY = this.points[1];
				for(var i = 0; i < this.points.length - 1; i += 2) {
					minY = Math.min(minY, this.points[i + 1]);
				}
				return minY;
			}
		},
		maxY: {
			get: function() {
				var maxY = this.points[1];
				for(var i = 0; i < this.points.length - 1; i += 2) {
					maxY = Math.max(maxY, this.points[i + 1]);
				}
				return maxY;
			}
		},
	});
	return Polygon;
});