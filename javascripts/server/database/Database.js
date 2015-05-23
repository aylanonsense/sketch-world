define([
	'mongoose'
], function(
	mongoose
) {
	var connected = false;
	var modelsDefined = false;
	var Polygon = null;

	function onceConnected(callback) {
		if(connected) {
			defineModels();
			callback();
		}
		mongoose.connection.once('open', function() {
			connected = true;
			defineModels();
			callback();
		});
	}

	function defineModels() {
		if(!modelsDefined) {
			modelsDefined = true;

			//define models!
			var polygonSchema = new mongoose.Schema({
				points: [ mongoose.Schema.Types.Number ],
				deleted: mongoose.Schema.Types.Boolean
			});
			Polygon = mongoose.model('Polygon', polygonSchema);
		}
	}

	function getAllPolygons(callback) {
		onceConnected(function() {
			Polygon.find({ deleted: false }, function(err, polys) {
				if(err) { throw new Error(err); }
				if(polys.length > 0) {
					if(callback) { callback(polys); }
				}
				else {
					//if there are no polygons we initialize the database with some starting polygons
					createPolygon({ points: [ 100,100, -100,100, -100,50, 100,50 ] }, function() {
						getAllPolygons(callback);
					});
				}
			});
		});
	}

	function createPolygon(state, callback) {
		onceConnected(function() {
			var polygon = new Polygon({
				points: state.points,
				deleted: false
			});
			polygon.save(function(err) {
				if(err) { throw new Error(err); }
				if(callback) { callback(polygon); }
			});
		});
	}

	function savePolygon(id, state, callback) {
		onceConnected(function() {
			Polygon.findById(id, function(err, polygon) {
				if(err) { throw new Error(err); }
				polygon.points = state.points;
				polygon.save(function(err) {
					if(err) { throw new Error(err); }
					if(callback) { callback(polygon); }
				});
			});
		});
	}

	function deletePolygon(id, callback) {
		onceConnected(function() {
			Polygon.findById(id, function(err, polygon) {
				if(err) { throw new Error(err); }
				polygon.deleted = true;
				polygon.save(function(err) {
					if(err) { throw new Error(err); }
					if(callback) { callback(polygon); }
				});
			});
		});
	}

	function reset(callback) {
		onceConnected(function() {
			Polygon.remove({}, function(err) {
				if(err) { throw new Error(err); }
				if(callback) { callback(); }
			});
		});
	}

	return {
		getAllPolygons: getAllPolygons,
		createPolygon: createPolygon,
		savePolygon: savePolygon,
		deletePolygon: deletePolygon,
		reset: reset
	};
});