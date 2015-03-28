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
		this._isConnected = true;
		this._isSynced = false;
		this._events = new EventHelper([ 'sync', 'receive', 'desync', 'disconnect' ]);

		//when we receive messages early we want to delay them until the correct frame
		this._messagesReceivedEarly = [];

		//bind events off of the raw connection
		this.rawConn = new RawConnection(socket);
		this.rawConn.on('receive', function(msg) {
			if(self._isConnected) {
				if(msg.messageType === 'ping') {
					self.rawConn.send({
						messageType: 'ping-response',
						pingId: msg.pingId,
						gameTime: Clock.getGameTime(),
						frame: Clock.getFrame()
					});
				}
				else if(msg.messageType === 'synced') {
					self._isSynced = true;
					self._events.trigger('sync');
				}
				else if(msg.messageType === 'desynced') {
					self._isSynced = false;
					self._bufferedMessagesToSend = [];
					self._messagesReceivedEarly = [];
					self._events.trigger('desync');
				}
				else if(msg.messageType === 'game-messages') {
					for(var i = 0; i < msg.messages.length; i++) {
						self._messagesReceivedEarly.push(msg.messages[i]);
					}
				}
			}
		});
		this.rawConn.on('disconnect', function() {
			self._isConnected = false;
			self._bufferedMessagesToSend = [];
			self._messagesReceivedEarly = [];
			self._events.trigger('disconnect');
		});
	}
	GameConnection.prototype.isConnected = function() {
		return this._isConnected;
	};
	GameConnection.prototype.isSynced = function() {
		return this._isSynced;
	};
	GameConnection.prototype.sameAs = function(otherConn) {
		return otherConn && otherConn.connId === this.connId;
	};
	GameConnection.prototype.on = function(eventName, callback) {
		this._events.on(eventName, callback);
	};
	GameConnection.prototype.receiveMessages = function() {
		while(this._messagesReceivedEarly.length > 0 &&
			this._messagesReceivedEarly[0].frame <= Clock.getFrame()) {
			var msg = this._messagesReceivedEarly.shift();
			var framesLate = (Clock.getFrame() - msg.frame);
			if(framesLate !== 0) {
				console.log("Message received " + framesLate +
					(framesLate > 1 ? " frames" : " frame") + " late!");
			}
			this._events.trigger('receive', msg.actualMessage);
		}
	};
	GameConnection.prototype.bufferSend = function(msg) {
		if(!this._isSynced) {
			console.log("[" + this.connId + "] Cannot buffer send while desynced!");
		}
		else if(!this._isConnected) {
			console.log("[" + this.connId + "] Cannot buffer send while disconnected!");
		}
		else {
			this._bufferedMessagesToSend.push({
				actualMessage: msg,
				gameTime: Clock.getGameTime(),
				frame: Clock.getFrame()
			});
		}
	};
	GameConnection.prototype.flush = function() {
		if(!this._isSynced) {
			console.log("[" + this.connId + "] Cannot flush while desynced!");
		}
		else if(!this._isConnected) {
			console.log("[" + this.connId + "] Cannot flush while disconnected!");
		}
		else {
			if(this._bufferedMessagesToSend.length > 0) {
				this.rawConn.send({
					messageType: 'game-messages',
					messages: this._bufferedMessagesToSend
				});
				this._bufferedMessagesToSend = [];
			}
		}
	};
	return GameConnection;
});