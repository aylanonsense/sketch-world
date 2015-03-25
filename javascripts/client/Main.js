define([
	'client/net/GameConnection',
	'client/net/Pinger',
	'shared/Constants',
	'client/Constants',
	'client/Game',
	'client/Clock',
	'shared/utils/now'
], function(
	GameConnection,
	Pinger,
	SharedConstants,
	Constants,
	Game,
	Clock,
	now
) {
	return function() {
		//set up the canvas
		var canvas = document.getElementById("game-canvas");
		canvas.setAttribute("width", Constants.CANVAS_WIDTH);
		canvas.setAttribute("height", Constants.CANVAS_HEIGHT);
		var ctx = canvas.getContext("2d");

		//reset the game
		Game.reset();

		//set up the game loop
		var prevTime = now();
		var timeToFlush = SharedConstants.OUTGOING_MESSAGE_BUFFER_TIME -
			0.5 / Constants.TARGET_FRAME_RATE;
		var timeToPing = Constants.TIME_BETWEEN_PINGS;
		function loop() {
			//calculate time since last loop was run
			var time = now();
			var t = time - prevTime;
			prevTime = time;

			//the game moves forward ~one frame
			Game.tick(t);
			Game.render(ctx);

			//every couple of frames any buffered messages are sent to the server
			timeToFlush -= t;
			if(timeToFlush <= 0.0) {
				GameConnection.flush();
				timeToFlush = SharedConstants.OUTGOING_MESSAGE_BUFFER_TIME -
					0.5 / Constants.TARGET_FRAME_RATE;
			}

			//very so often we ping the server
			timeToPing -= t;
			if(timeToPing <= 0.0) {
				Pinger.ping();
				timeToPing = Constants.TIME_BETWEEN_PINGS;
			}

			//the next loop is scheduled
			requestAnimationFrame(loop);
		}

		//kick off the game loop
		requestAnimationFrame(loop);

		//add mouse handler
		canvas.onmousedown = onMouseEvent;
		document.onmouseup = onMouseEvent;
		document.onmousemove = onMouseEvent;
		function onMouseEvent(evt) {
			Game.onMouseEvent({
				type: evt.type,
				x: evt.clientX - canvas.offsetLeft + document.body.scrollLeft,
				y: evt.clientY - canvas.offsetTop + document.body.scrollTop
			});
		}

		//add keyboard handler
		var keyboard = {};
		for(var key in Constants.KEY_BINDINGS) { keyboard[Constants.KEY_BINDINGS[key]] = false; }
		document.onkeyup = onKeyboardEvent;
		document.onkeydown = onKeyboardEvent;
		function onKeyboardEvent(evt) {
			var isDown = (evt.type === 'keydown');
			if(Constants.KEY_BINDINGS[evt.which] &&
				keyboard[Constants.KEY_BINDINGS[evt.which]] !== isDown) {
				keyboard[Constants.KEY_BINDINGS[evt.which]] = isDown;
				Game.onKeyboardEvent({
					isDown: isDown,
					key: Constants.KEY_BINDINGS[evt.which]
				}, keyboard);
			}
		}

		//connect to server
		GameConnection.connect();
		GameConnection.on('disconnect', function() {
			GameConnection.reset();
			Pinger.reset();
			Game.reset();
			Clock.reset();
		});
	};
});