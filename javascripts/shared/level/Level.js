define([
	'shared/level/Polygon'
], function(
	Polygon
) {
	var nextTempPolyId = 0;
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
	Level.prototype.addPolygon = function(state) {
		var polygon = new Polygon(state);
		this.polygons.push(polygon);
		return polygon;
	};
	Level.prototype.addTempPolygon = function(state, idPrefix) {
		state.tempPolyId = idPrefix + (nextTempPolyId++);
		var polygon = new Polygon(state);
		this.polygons.push(polygon);
		return polygon;
	};
	Level.prototype.replaceTempPolygon = function(tempPolyId, state) {
		for(var i = 0; i < this.polygons.length; i++) {
			if(this.polygons[i].tempPolyId === tempPolyId) {
				this.polygons[i].setState(state);
				return this.polygons[i];
			}
		}
	};
	Level.prototype.getPolygon = function(state) {
		var i;
		if(state.id !== null) {
			for(i = 0; i < this.polygons.length; i++) {
				if(this.polygons[i].polyId === state.id) {
					return this.polygons[i];
				}
			}
		}
		if(state.tempPolyId !== null) {
			for(i = 0; i < this.polygons.length; i++) {
				if(this.polygons[i].tempPolyId === state.tempPolyId) {
					return this.polygons[i];
				}
			}
		}
		return null;
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