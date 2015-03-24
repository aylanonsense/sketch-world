define([
	'server/net/RawConnection',
	'server/Clock',
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
	var nextConnId = 0;
	function GameConnection(socket) {
		var self = this;
		this.connId = nextConnId++;
		this._bufferedMessagesToSend = [];
		this._events = new EventHelper([ 'receive', 'disconnect' ]);

		//when we receive messages early we want to delay them until they are on time
		this._messagesReceivedEarly = new DelayQueue();
		this._messagesReceivedEarly.on('dequeue', function(msg) {
			self._events.trigger('receive', msg);
		});

		//bind events off of the raw connection
		this.rawConn = new RawConnection(socket);
		this.rawConn.on('receive', function(msg) {
			if(msg.messageType === 'game-messages') {
				for(var i = 0; i < msg.messages.length; i++) {
					self._messagesReceivedEarly.enqueue(msg.messages[i],
						now() + msg.messages[i].gameTime - Clock.getGameTime());
				}
			}
		});
		this.rawConn.on('disconnect', function() {
			self._events.trigger('disconnect');
		});
	}
	GameConnection.prototype.sameAs = function(otherConn) {
		return otherConn && otherConn.connId === this.connId;
	};
	GameConnection.prototype.on = function(eventName, callback) {
		this._events.on(eventName, callback);
	};
	GameConnection.prototype.bufferSend = function(msg) {
		msg.gameTime = Clock.getGameTime();
		this._bufferedMessagesToSend.push(msg);
	};
	GameConnection.prototype.flush = function() {
		if(this._bufferedMessagesToSend.length > 0) {
			this.rawConn.send({
				messageType: 'game-messages',
				messages: this._bufferedMessagesToSend
			});
			this._bufferedMessagesToSend = [];
		}
	};
	return GameConnection;
});