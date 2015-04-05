define([
	'shared/utils/EventHelper',
	'shared/utils/DelayQueue',
	'shared/utils/generateFakeLag',
	'shared/utils/now'
], function(
	EventHelper,
	DelayQueue,
	generateFakeLag,
	now
) {
	function RawConnection(socket) {
		var self = this;
		this._events = new EventHelper([ 'receive', 'disconnect' ]);

		//set up message queues (allows us to add fake lag)
		this._inboundMessages = new DelayQueue();
		this._inboundMessages.on('dequeue', function(msg) {
			self._events.trigger('receive', msg);
		});
		this._outboundMessages = new DelayQueue();
		this._outboundMessages.on('dequeue', function(msg) {
			self._socket.emit('message', msg);
		});

		//handle the socket
		this._socket = socket;
		this._socket.on('message', function(msg) {
			self._inboundMessages.enqueue(msg, now() + generateFakeLag());
		});
		this._socket.on('disconnect', function() {
			self._events.trigger('disconnect');
		});
	}
	RawConnection.prototype.send = function(msg) {
		this._outboundMessages.enqueue(msg, now() + generateFakeLag());
	};
	RawConnection.prototype.on = function(eventName, callback) {
		this._events.on(eventName, callback);
	};
	RawConnection.prototype.disconnect = function() {
		this._socket.disconnect();
	};
	return RawConnection;
});