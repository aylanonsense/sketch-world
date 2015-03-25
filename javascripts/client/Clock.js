define([
	'shared/Constants',
	'shared/utils/now'
], function(
	SharedConstants,
	now
) {
	var gameTimeOffset = 0.0;
	var roundTripTime = 0.0;

	//game time is the same on the server and the client
	// i.e. if the server is at gameTime=5.00 every client should be at gameTime=5.00 too
	function getGameTime() {
		return now() + gameTimeOffset;
	}

	//the game time such that a message sent from the server at gameTime=5.00
	// will arrive at clientGameTime=5.00
	function getClientGameTime() {
		return getGameTime() - getTimeFromServerToClient();
	}

	//the game time such that a round-trip message sent from the client at serverGameTime=5.00
	// will arrive back at the client at clientGameTime=5.00
	function getServerGameTime() {
		return getGameTime() + getTimeFromClientToServer();
	}

	//calculated latency client <--> server
	function getTimeFromClientToServer() {
		return roundTripTime / 2 + SharedConstants.CLIENT_OUTGOING_MESSAGE_BUFFER_TIME;
	}
	function getTimeFromServerToClient() {
		return roundTripTime / 2 + SharedConstants.SERVER_OUTGOING_MESSAGE_BUFFER_TIME;
	}

	return {
		getGameTime: getGameTime,
		getClientGameTime: getClientGameTime,
		getServerGameTime: getServerGameTime,
		setGameTimeOffset: function(offset) {
			gameTimeOffset = offset;
		},
		setRoundTripTime: function(time) {
			roundTripTime = time;
		},
		reset: function() {
			gameTimeOffset = 0.0;
			roundTripTime = 0.0;
		}
	};
});