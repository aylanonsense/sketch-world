define(function() {
	return function(fromObj, toObj, keys) {
		for(var i = 0; i < keys.length; i++) {
			toObj[keys[i]] = fromObj[keys[i]];
		}
		return toObj;
	};
});