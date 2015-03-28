define([
	'client/net/RawConnection',
	'client/Clock',
	'client/Constants',
	'shared/Constants',
	'shared/utils/EventHelper',
	'shared/utils/now'
], function(
	RawConnection,
	Clock,
	Constants,
	SharedConstants,
	EventHelper,
	now
) {
	var nextPingId = 0;
	var pings = [];
	var events = new EventHelper([ 'sync' ]);
	var minServerTimeOffset = null;
	var maxServerTimeOffset = null;
	var minFrameOffset = null;
	var maxFrameOffset = null;
	var adjustedRoundTripTime = null;
	var pingsSinceRoundTripTimeLowered = 0;
	var isSynced = false;

	RawConnection.on('receive', function(msg) {
		if(msg.messageType === 'ping-response') {
			var time = now();
			for(var i = 0; i < pings.length; i++) {
				if(pings[i].pingId === msg.pingId) {
					//we got a response to one of our pings
					var gameTime = msg.gameTime;
					var frame = msg.frame;
					pings[i].received = time;
					var roundTripTime = pings[i].received - pings[i].sent;

					//see if we can't gain a better estimate of server time
					var minGameTime = gameTime;
					var maxGameTime = gameTime + roundTripTime;
					var offsetChanged = false;
					if(minServerTimeOffset === null || minServerTimeOffset < minGameTime - time) {
						minServerTimeOffset = minGameTime - time;
						offsetChanged = true;
					}
					if(maxServerTimeOffset === null || maxServerTimeOffset > maxGameTime - time) {
						maxServerTimeOffset = maxGameTime - time;
						offsetChanged = true;
					}
					//with a better estimate, we can update the clock (game time is now more accurate)
					if(offsetChanged) {
						Clock.setGameTimeOffset((minServerTimeOffset + maxServerTimeOffset) / 2);
					}

					//set if we can't get a better estiamte of FRAME time
					var minFrame = frame;
					var maxFrame = frame + Math.ceil(roundTripTime / SharedConstants.TARGET_FRAME_RATE);
					offsetChanged = false;
					if(minFrameOffset === null || minFrameOffset < minFrame - Clock.getBaseFrame()) {
						minFrameOffset = minFrame - Clock.getBaseFrame();
						offsetChanged = true;
					}
					if(maxFrameOffset === null || maxFrameOffset > maxFrame - Clock.getBaseFrame()) {
						maxFrameOffset = maxFrame - Clock.getBaseFrame();
						offsetChanged = true;
					}
					//with a better estimate, we can update the clock (game time is now more accurate)
					if(offsetChanged) {
						Clock.setFrameOffset(Math.ceil((minFrameOffset + maxFrameOffset) / 2));
					}

					//may need to increase/decrease delay depending on lag
					recalculateRoundTripTime();

					//we only need one ping response to qualify as "synced"
					if(!isSynced) {
						isSynced = true;
						events.trigger('sync');
					}
					break;
				}
			}
		}
	});

	function recalculateRoundTripTime() {
		pingsSinceRoundTripTimeLowered++;

		//create sorted list of client --> server --> client times (highest time first)
		var latencies = pings.filter(function(ping) {
			return ping.received !== null;
		}).map(function(ping) {
			return ping.received - ping.sent;
		}).sort(function(a, b) { return b - a; });

		//the laggiest couple of pings are ignored -- they may be anomalies -- so we choose
		// the next highest as the one to shoot for
		var roundTripTime = latencies[Math.min(Constants.PINGS_TO_IGNORE, latencies.length - 1)];

		//if we don't have a guess for round trip time yet, this is the best estimate to use
		// OR if the network got worse we can safely adopt the new time -- client will stutter
		if(adjustedRoundTripTime === null || adjustedRoundTripTime <= roundTripTime) {
			pingsSinceRoundTripTimeLowered = 0;
			adjustedRoundTripTime = roundTripTime;
			Clock.setRoundTripTime(roundTripTime);
		}
		//if the network got better, we might not trust that it will stay good
		else {
			//we only accept the network got better if the "gains" are worth it
			var gains = Math.sqrt(adjustedRoundTripTime - roundTripTime); //we undervalue huge gains
			if(gains * pingsSinceRoundTripTimeLowered >
				Constants.GAINS_REQUIRED_TO_LOWER_ROUND_TRIP_TIME) {
				adjustedRoundTripTime = roundTripTime;
				Clock.setRoundTripTime(roundTripTime);
			}
		}
	}

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		ping: function() {
			var id = nextPingId++;
			pings.push({ pingId: id, sent: now(), received: null });
			if(pings.length > Constants.NUM_CACHED_PINGS) { pings.shift(); }
			RawConnection.send({ messageType: 'ping', pingId: id });
		},
		reset: function() {
			pings = [];
			minServerTimeOffset = null;
			maxServerTimeOffset = null;
			adjustedRoundTripTime = null;
			pingsSinceRoundTripTimeLowered = 0;
			isSynced = false;
		}
	};
});