define([
	'server/net/GameConnectionServer',
	'server/Constants',
	'server/Game',
	'shared/utils/now'
], function(
	GameConnectionServer,
	Constants,
	Game,
	now
) {
	return function() {
		//set up the game loop
		var prevTime = now();
		var timeToFlush = Constants.OUTGOING_MESSAGE_BUFFER_TIME;
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
					conn.flush();
				});
				timeToFlush = Constants.OUTGOING_MESSAGE_BUFFER_TIME;
			}
		}

		//kick off the game loop
		setInterval(loop, 1000 / Constants.TARGET_FRAME_RATE);
	};
});