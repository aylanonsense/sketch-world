define(function() {
	var nextGeomId = 0;
	function LevelGeom(type) {
		this.geomId = nextGeomId++;
		this.geomType = type;
	}
	LevelGeom.prototype.sameAs = function(other) {
		return other && this.geomId === other.geomId;
	};
	LevelGeom.prototype.sameAsAny = function(others) {
		if(others) {
			for(var i = 0; i < others.length; i++) {
				if(this.sameAs(others[i])) {
					return true;
				}
			}
		}
		return false;
	};
	return LevelGeom;
});