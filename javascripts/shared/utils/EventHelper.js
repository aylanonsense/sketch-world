define(function() {
	function EventHelper(eventNames, flags) {
		flags = flags || {};
		this._eventCallbacks = {};
		this._flagCallbacks = {};
		eventNames = eventNames || [];
		for(var i = 0; i < eventNames.length; i++) {
			this._eventCallbacks[eventNames[i]] = [];
		}
		this._flags = {};
		for(var flagName in flags) {
			this._flags[flagName] = flags[flagName];
			this._flagCallbacks[flagName] = [];
		}
	}
	EventHelper.prototype.trigger = function(eventName, data) {
		if(!this._eventCallbacks[eventName]) {
			throw new Error("Event '" + eventName + "' is not registered");
		}
		for(var i = 0; i < this._eventCallbacks[eventName].length; i++) {
			this._eventCallbacks[eventName][i](data);
		}
	};
	EventHelper.prototype.on = function(eventName, callback) {
		if(!this._eventCallbacks[eventName]) {
			throw new Error("Event '" + eventName + "' is not registered");
		}
		this._eventCallbacks[eventName].push(callback);
	};
	EventHelper.prototype.get = function(flagName) {
		return this._flags[flagName];
	};
	EventHelper.prototype.set = function(flagName, value) {
		if(!this._flagCallbacks[flagName]) {
			throw new Error("Flag '" + flagName + "' is not registered");
		}
		if(this._flags[flagName] !== value) {
			this._flags[flagName] = value;
			for(var i = 0; i < this._flagCallbacks[flagName].length; i++) {
				if(this._flagCallbacks[flagName][i].value === value) {
					this._flagCallbacks[flagName][i].callback(data);
				}
			}
		}
	};
	EventHelper.prototype.when = function(flagName, value, callback) {
		if(!this._flagCallbacks[flagName]) {
			throw new Error("Flag '" + flagName + "' is not registered");
		}
		this._flagCallbacks[flagName].push({ value: value, callback: callback });
	};
	return EventHelper;
});