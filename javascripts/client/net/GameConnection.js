define([
	'client/net/RawConnection',
	'client/Clock',
	'shared/utils/EventHelper',
	'shared/utils/DelayQueue',
	'client/net/Pinger',
	'shared/utils/now'
], function(
	RawConnection,
	Clock,
	EventHelper,
	DelayQueue,
	Pinger,
	now
) {
	var bufferedMessagesToSend = [];
	var isConnected = false;
	var isSynced = false;
	var events = new EventHelper([ 'connect', 'sync', 'receive', 'desync', 'disconnect' ]);

	//when we receive messages early we want to delay them until they are on time
	var messagesReceivedEarly = new DelayQueue();
	messagesReceivedEarly.on('dequeue', function(msg) {
		events.trigger('receive', msg.actualMessage);
	});

	//bind events off of the raw connection
	RawConnection.on('connect', function() {
		events.trigger('connect');
		isConnected = true;
	});
	RawConnection.on('receive', function(msg) {
		if(msg.messageType === 'game-messages') {
			for(var i = 0; i < msg.messages.length; i++) {
				messagesReceivedEarly.enqueue(msg.messages[i],
					now() + msg.messages[i].gameTime - Clock.getClientGameTime());
			}
		}
	});
	RawConnection.on('disconnect', function() {
		events.trigger('disconnect');
		isConnected = false;
	});

	//bind events off of our pinging service
	Pinger.on('sync', function() {
		events.trigger('sync');
		isSynced = true;
		RawConnection.send({ messageType: 'synced' });
	});

	return {
		connect: function() {
			RawConnection.connect();
		},
		isConnected: function() {
			return isConnected;
		},
		isSynced: function() {
			return isSynced;
		},
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		bufferSend: function(msg) {
			if(!isConnected) {
				console.error("Cannot buffer send while disconnected!");
			}
			else if(!isSynced) {
				console.error("Cannot buffer send while desynced!");
			}
			else {
				bufferedMessagesToSend.push({ actualMessage: msg, gameTime: Clock.getServerGameTime() });
			}
		},
		flush: function() {
			if(!isConnected) {
				console.error("Cannot flush while disconnected!");
			}
			else if(!isSynced) {
				console.error("Cannot flush while desynced!");
			}
			else {
				if(bufferedMessagesToSend.length > 0) {
					RawConnection.send({
						messageType: 'game-messages',
						messages: bufferedMessagesToSend
					});
					bufferedMessagesToSend = [];
				}
			}
		},
		reset: function() {
			bufferedMessagesToSend = [];
			if(isSynced) {
				isSynced = false;
				if(isConnected) {
					events.trigger('desync');
					RawConnection.send({ messageType: 'desynced' });
				}
			}
			messagesReceivedEarly.empty();
			RawConnection.reset();
		}
	};
});