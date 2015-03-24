define([
	'client/net/RawConnection',
	'client/Clock',
	'shared/utils/EventHelper',
	'shared/utils/DelayQueue',
	'shared/utils/now'
], function(
	RawConnection,
	Clock,
	EventHelper,
	DelayQueue,
	now
) {
	var bufferedMessagesToSend = [];
	var events = new EventHelper([ 'connect', 'receive', 'disconnect' ]);

	//when we receive messages early we want to delay them until they are on time
	var messagesReceivedEarly = new DelayQueue();
	messagesReceivedEarly.on('dequeue', function(msg) {
		events.trigger('receive', msg);
	});

	//bind events off of the raw connection
	RawConnection.on('connect', function() {
		events.trigger('connect');
	});
	RawConnection.on('receive', function(msg) {
		if(msg.messageType === 'game-messages') {
			for(var i = 0; i < msg.messages.length; i++) {
				messagesReceivedEarly.enqueue(msg.messages[i],
					now() + msg.messages[i].gameTime - Clock.getGameTime());
			}
		}
	});
	RawConnection.on('disconnect', function() {
		events.trigger('disconnect');
	});

	return {
		connect: function() {
			RawConnection.connect();
		},
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		bufferSend: function(msg) {
			msg.gameTime = Clock.getGameTime() + Clock.getTravelTimeToServer();
			bufferedMessagesToSend.push(msg);
		},
		flush: function() {
			if(bufferedMessagesToSend.length > 0) {
				RawConnection.send({
					messageType: 'game-messages',
					messages: bufferedMessagesToSend
				});
				bufferedMessagesToSend = [];
			}
		}
	};
});