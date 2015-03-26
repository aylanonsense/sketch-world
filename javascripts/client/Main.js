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
		var syncedSimTimePassed = 0.0;
		var gameTimePassed = 0.0;
		var simTimeAdjustDir = 0;
		var prevTime = now();
		var prevClientGameTime = null;
		var timeToFlush = SharedConstants.CLIENT_OUTGOING_MESSAGE_BUFFER_TIME -
			0.5 / Constants.TARGET_FRAME_RATE;
		var timeToPing = 0.0;
		function loop() {
			//calculate time since last loop was run
			var time = now();
			var t = time - prevTime;
			prevTime = time;

			//if we're connected, we might face a circumstance where the network gets worse/better,
			// in which case we'll adjust the speed of the simulation until it matches the game time
			var tSim = t;
			if(GameConnection.isConnected() && GameConnection.isSynced()) {
				//we might need to adjust the sim time
				//if we're moving faster than normal, we may want to return to normal speed
				if(simTimeAdjustDir === 1 && syncedSimTimePassed >= gameTimePassed) {
					simTimeAdjustDir = 0;
					Clock.speed = 1.0; //for debug purposes
				}
				//if we're moving slower than normal, we may want to return to normal speed
				else if(simTimeAdjustDir === -1 && syncedSimTimePassed <= gameTimePassed) {
					simTimeAdjustDir = 0;
					Clock.speed = 1.0; //for debug purposes
				}
				//if we're way behind, we may want to speed up
				else if(syncedSimTimePassed < gameTimePassed - Constants.TIME_REQUIRED_TO_SPEED_UP_SIM) {
					simTimeAdjustDir = 1;
					Clock.speed = Constants.SPEED_UP_SIM_MULT; //for debug purposes
				}
				//if we're way ahead, we may want to slow down
				else if(syncedSimTimePassed > gameTimePassed + Constants.TIME_REQUIRED_TO_SLOW_DOWN_SIM) {
					simTimeAdjustDir = -1;
					Clock.speed = Constants.SLOW_DOWN_SIM_MULT; //for debug purposes
				}

				//adjust the sim time passed accordingly
				if(simTimeAdjustDir === 1) {
					tSim *= Constants.SPEED_UP_SIM_MULT;
				}
				else if(simTimeAdjustDir === -1) {
					tSim *= Constants.SLOW_DOWN_SIM_MULT;
				}
				syncedSimTimePassed += tSim;

				//calculate the actual game time passed
				var clientGameTime = Clock.getClientGameTime();
				if(prevClientGameTime !== null) {
					if(clientGameTime > prevClientGameTime) {
						gameTimePassed += clientGameTime - prevClientGameTime;
						prevClientGameTime = clientGameTime;
					}
				}
				else {
					prevClientGameTime = clientGameTime;
				}

				//finally, if we really get way out of sync, we may need to strategically reset
				if(Math.abs(gameTimePassed - syncedSimTimePassed) > Constants.TIME_REQUIRED_TO_RESET) {
					console.log("Resetting due to major desync!");
					Game.tick(tSim);
					Game.render(ctx);
					reset();
					requestAnimationFrame(loop);
					return;
				}
			}

			//the game moves forward ~one frame
			Game.tick(tSim);
			Game.render(ctx);

			if(GameConnection.isConnected()) {
				if(GameConnection.isSynced()) {
					//every couple of frames any buffered messages are sent to the server
					timeToFlush -= t;
					if(timeToFlush <= 0.0) {
						GameConnection.flush();
						timeToFlush = SharedConstants.CLIENT_OUTGOING_MESSAGE_BUFFER_TIME -
							0.5 / Constants.TARGET_FRAME_RATE;
					}
				}

				//every so often we ping the server
				timeToPing -= t;
				if(timeToPing <= 0.0) {
					Pinger.ping();
					timeToPing = Constants.TIME_BETWEEN_PINGS;
				}
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
		GameConnection.on('sync', function() {
			syncedSimTimePassed = 0.0;
			gameTimePassed = 0.0;
			simTimeAdjustDir = 0;
			Clock.speed = 1.0; //for debug purposes
		});
		GameConnection.on('disconnect', reset);

		//helpful methods
		function reset() {
			syncedSimTimePassed = 0.0;
			gameTimePassed = 0.0;
			simTimeAdjustDir = 0;
			Clock.speed = 1.0; //for debug purposes
			prevClientGameTime = null;
			timeToFlush = SharedConstants.CLIENT_OUTGOING_MESSAGE_BUFFER_TIME -
				0.5 / Constants.TARGET_FRAME_RATE;
			timeToPing = 0.0;
			GameConnection.reset();
			Pinger.reset();
			Game.reset();
			Clock.reset();
		}
	};
});