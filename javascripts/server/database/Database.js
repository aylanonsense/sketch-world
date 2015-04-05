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
				points: [ mongoose.Schema.Types.Number ]
			});
			Polygon = mongoose.model('Polygon', polygonSchema);
		}
	}

	function getAllPolygons(callback) {
		onceConnected(function() {
			Polygon.find({}, function(err, polys) {
				if(err) { throw new Error(err); }
				if(polys.length > 0) {
					if(callback) { callback(polys); }
				}
				else {
					//if there are no polygons we initialize the database with some starting polygons
					(new Polygon({ points: [ 100,100, -100,100, -100,50, 100,50 ] })).save(function(err) {
						if(err) { throw new Error(err); }
						getAllPolygons(callback);
					});
				}
			});
		});
	}

	function addPolygon(state, callback) {
		onceConnected(function() {
			var polygon = new Polygon({
				points: state.points
			});
			polygon.save(function(err) {
				if(err) { throw new Error(err); }
				if(callback) { callback(polygon); }
			});
		});
	}

	function modifyPolygon(state, callback) {
		onceConnected(function() {
			Polygon.findById(state.id, function(err, polygon) {
				if(err) { throw new Error(err); }
				polygon.points = state.points;
				polygon.save(function(err) {
					if(err) { throw new Error(err); }
					if(callback) { callback(polygon); }
				});
			});
		});
	}

	return {
		getAllPolygons: getAllPolygons,
		addPolygon: addPolygon,
		modifyPolygon: modifyPolygon
	};
});