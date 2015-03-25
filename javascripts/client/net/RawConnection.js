define([
	'shared/utils/DelayQueue',
	'shared/utils/EventHelper',
	'shared/utils/generateFakeLag',
	'shared/utils/now'
], function(
	DelayQueue,
	EventHelper,
	generateFakeLag,
	now
) {
	var socket = null;
	var events = new EventHelper([ 'connect', 'receive', 'disconnect' ]);

	//set up message queues (allows us to add fake lag)
	var inboundMessages = new DelayQueue();
	inboundMessages.on('dequeue', function(msg) {
		events.trigger('receive', msg);
	});
	var outboundMessages = new DelayQueue();
	outboundMessages.on('dequeue', function(msg) {
		socket.emit('message', msg);
	});

	return {
		connect: function() {
			if(!socket) {
				socket = io();

				//set up socket io
				socket.on('connect', function() {
					events.trigger('connect');
				});
				socket.on('message', function(msg) {
					inboundMessages.enqueue(msg, now() + generateFakeLag());
				});
				socket.on('disconnect', function(){
					events.trigger('disconnect');
				});
			}
		},
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		send: function(msg) {
			outboundMessages.enqueue(msg, now() + generateFakeLag());
		},
		reset: function() {
			inboundMessages.empty();
			outboundMessages.empty();
		}
	};
});