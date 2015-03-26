define([
	'server/net/GameConnectionServer',
	'shared/Constants',
	'server/Constants',
	'server/Clock',
	'server/Game',
	'shared/utils/now'
], function(
	GameConnectionServer,
	SharedConstants,
	Constants,
	Clock,
	Game,
	now
) {
	return function() {
		//set up the game loop
		var prevTime = now();
		var timeToFlush = SharedConstants.SERVER_OUTGOING_MESSAGE_BUFFER_TIME -
			0.5 / Constants.TARGET_FRAME_RATE;
		function loop() {
			//calculate time since last loop was run
			var time = now();
			var t = time - prevTime;
			prevTime = time;

			//the game moves forward ~one frame
			Game.tick(t);

			//every couple of frames any buffered messages are sent out to clients
			timeToFlush -= t;
			if(timeToFlush <= 0.0) {
				GameConnectionServer.forEach(function(conn) {
					if(conn.isConnected() && conn.isSynced()) {
						conn.flush();
					}
				});
				timeToFlush = SharedConstants.SERVER_OUTGOING_MESSAGE_BUFFER_TIME -
					0.5 / Constants.TARGET_FRAME_RATE;
			}
		}

		//kick off the game loop
		setInterval(loop, 1000 / Constants.TARGET_FRAME_RATE);
	};
});