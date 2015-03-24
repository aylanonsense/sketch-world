define([
	'client/net/GameConnection',
	'client/Constants',
	'client/Game',
	'shared/utils/now'
], function(
	GameConnection,
	Constants,
	Game,
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
		var timeToFlush = Constants.OUTGOING_MESSAGE_BUFFER_TIME;
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
				timeToFlush = Constants.OUTGOING_MESSAGE_BUFFER_TIME;
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
	};
});