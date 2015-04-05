define([
	'shared/level/geometry/Point',
	'shared/level/geometry/Line'
], function(
	Point,
	Line
) {
	function Polygon(state) {
		this.polyId = null;
		this.tempPolyId = null;
		this.points = [];
		this._geometry = [];
		if(state) {
			this.setState(state);
		}
	}
	Polygon.prototype.getState = function() {
		return {
			id: this.polyId,
			tempPolyId: this.tempPolyId,
			points: this.points
		};
	};
	Polygon.prototype.setState = function(state) {
		this.polyId = state.id;
		this.tempPolyId = state.tempPolyId;
		this.points = state.points;
		this.recalculateGeometry();
	};
	Polygon.prototype.recalculateGeometry = function() {
		this._geometry = [];
		for(var i = 0; i < this.points.length - 1; i += 2) {
			this._geometry.push(new Point(this.points[i], this.points[i + 1]));
			this._geometry.push(new Line(this.points[i], this.points[i + 1],
				this.points[(i + 2) % this.points.length], this.points[(i + 3) % this.points.length]));
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
	return Polygon;
});