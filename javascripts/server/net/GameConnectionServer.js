define([
	'server/net/GameConnection',
	'shared/utils/EventHelper'
], function(
	GameConnection,
	EventHelper
) {
	var connections = [];
	var events = new EventHelper([ 'connect' ]);

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		forEach: function(callback) {
			for(var i = 0; i < connections.length; i++) {
				callback(connections[i]);
			}
		},
		handleSocket: function(socket) {
			var conn = new GameConnection(socket);
			connections.push(conn);
			conn.on('disconnect', function() {
				connections = connections.filter(function(otherConn) {
					return !conn.sameAs(otherConn);
				});
			});
			events.trigger('connect', conn);
		}
	};
});