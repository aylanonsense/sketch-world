define([
	'shared/level/Polygon'
], function(
	Polygon
) {
	function Level(state) {
		this.polygons = [];
		if(state) {
			this.setState(state);
		}
	}
	Level.prototype.checkForCollision = function(entity) {
		var earliestCollision = null;
		for(var i = 0; i < this.polygons.length; i++) {
			var collision = this.polygons[i].checkForCollision(entity);
			if(collision && (!earliestCollision || collision.distTraveled < earliestCollision.distTraveled)) {
				earliestCollision = collision;
			}
		}
		return earliestCollision;
	};
	Level.prototype.getState = function() {
		return {
			polygons: this.polygons.map(function(polygon) {
				return polygon.getState();
			})
		};
	};
	Level.prototype.setState = function(state) {
		this.polygons = state.polygons.map(function(polygonState) {
			return new Polygon(polygonState);
		});
	};
	return Level;
});