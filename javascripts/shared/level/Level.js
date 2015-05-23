define([
	'shared/level/Polygon'
], function(
	Polygon
) {
	var nextPolyId = 0;
	var polygons = [];

	return {
		reset: function() {
			polygons = [];
		},
		getPolygonById: function(id) {
			for(var i = 0; i < polygons.length; i++) {
				if(polygons[i].id === id) {
					return polygons[i];
				}
			}
			return null;
		},
		getPolygons: function() {
			return polygons;
		},
		createPolygon: function(state, idPrefix) {
			var polygon = new Polygon(state);
			polygons.push(polygon);
			return polygon;
		},
		createPolygonAndAssignId: function(state, idPrefix) {
			state.id = (idPrefix || "") + (nextPolyId++);
			var polygon = new Polygon(state);
			polygons.push(polygon);
			return polygon;
		},
		removePolygonById: function(id) {
			polygons = polygons.filter(function(polygon) {
				return polygon.id !== id;
			});
		},
		checkForCollision: function(entity) {
			var earliestCollision = null;
			for(var i = 0; i < polygons.length; i++) {
				var collision = polygons[i].checkForCollision(entity);
				if(collision && (!earliestCollision || collision.distTraveled < earliestCollision.distTraveled)) {
					earliestCollision = collision;
				}
			}
			return earliestCollision;
		},
		getState: function() {
			return {
				polygons: polygons.map(function(polygon) {
					return polygon.getState();
				})
			};
		},
		setState: function(state) {
			polygons = state.polygons.map(function(state) {
				return new Polygon(state);
			});
		}
		/*reset: function() {
			polygons = [];
		},
		getPolygons: function() {
			return polygons;
		},
		checkForCollision: function(entity) {
			var earliestCollision = null;
			for(var i = 0; i < polygons.length; i++) {
				var collision = polygons[i].checkForCollision(entity);
				if(collision && (!earliestCollision || collision.distTraveled < earliestCollision.distTraveled)) {
					earliestCollision = collision;
				}
			}
			return earliestCollision;
		},
		addPolygon: function(state) {
			var polygon = new Polygon(state);
			polygons.push(polygon);
			return polygon;
		},
		addTempPolygon: function(state, idPrefix) {
			state.tempPolyId = idPrefix + (nextTempPolyId++);
			var polygon = new Polygon(state);
			polygons.push(polygon);
			return polygon;
		},
		replaceTempPolygon: function(tempPolyId, state) {
			for(var i = 0; i < polygons.length; i++) {
				if(polygons[i].tempPolyId === tempPolyId) {
					polygons[i].setState(state);
					return polygons[i];
				}
			}
		},
		getPolygon: function(state) {
			var i;
			if(state.id !== null) {
				for(i = 0; i < polygons.length; i++) {
					if(polygons[i].polyId === state.id) {
						return polygons[i];
					}
				}
			}
			if(state.tempPolyId !== null) {
				for(i = 0; i < polygons.length; i++) {
					if(polygons[i].tempPolyId === state.tempPolyId) {
						return polygons[i];
					}
				}
			}
			return null;
		},
		getState: function() {
			return {
				polygons: polygons.map(function(polygon) {
					return polygon.getState();
				})
			};
		},
		setState: function(state) {
			polygons = state.polygons.map(function(state) {
				return new Polygon(state);
			});
		}*/
	};
});