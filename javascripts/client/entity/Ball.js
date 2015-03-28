define([
	'shared/entity/Ball',
	'client/net/GameConnection'
], function(
	BallSim,
	GameConnection
) {
	function Ball(id, state) {
		this.entityId = id;
		this._isPlayerControlled = false;
		this._sim = new BallSim(state);
		this._serverSim = new BallSim(state);
		this._moveDirX = 0;
		this._moveDirY = 0;
		this._timeSinceStateUpdate = 0.0;
	}
	Ball.prototype.setPlayerControlled = function(playerControlled) {
		this._isPlayerControlled = playerControlled;
	};
	Ball.prototype.tick = function(t) {
		this._sim.tick(t);
		this._serverSim.tick(t);
		this._timeSinceStateUpdate += t;
	};
	Ball.prototype.onMouseEvent = function(evt) {};
	Ball.prototype.onKeyboardEvent = function(evt, keyboard) {
		if(evt.key === 'MOVE_LEFT') {
			this._setMoveDir((evt.isDown ? -1 : (keyboard.MOVE_RIGHT ? 1 : 0)), null);
		}
		else if(evt.key === 'MOVE_RIGHT') {
			this._setMoveDir((evt.isDown ? 1 : (keyboard.MOVE_LEFT ? -1 : 0)), null);
		}
		else if(evt.key === 'MOVE_UP') {
			this._setMoveDir(null, (evt.isDown ? -1 : (keyboard.MOVE_DOWN ? 1 : 0)));
		}
		else if(evt.key === 'MOVE_DOWN') {
			this._setMoveDir(null, (evt.isDown ? 1 : (keyboard.MOVE_UP ? -1 : 0)));
		}
	};
	Ball.prototype._setMoveDir = function(x, y) {
		this._handleAndSendInput('set-waypoint', { x: this._sim.x, y: this._sim.y, moveX: x, moveY: y });
	};
	Ball.prototype._handleAndSendInput = function(input, details) {
		this._sim.onInput(input, details);
		GameConnection.bufferSend({ messageType: 'player-input', input: input, details: details });
	};
	Ball.prototype.onInputFromServer = function(input, details) {
		if(!this._isPlayerControlled) {
			this._sim.onInput(input, details);
		}
		this._serverSim.onInput(input, details);
	};
	Ball.prototype.onStateUpdateFromServer = function(state) {
		this._serverSim.setState(state);
		this._timeSinceStateUpdate = 0.0;
	};
	Ball.prototype.render = function(ctx, camera) {
		//draw a "ping" when the entity receives an update
		if(this._timeSinceStateUpdate < 0.50) {
			ctx.strokeStyle = 'rgba(0, 0, 0, ' + (1.0 - 2 * this._timeSinceStateUpdate) + ')';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(this._serverSim.x - camera.x, this._serverSim.y - camera.y,
				this._serverSim.radius - 1 + 100 * this._timeSinceStateUpdate, 0, 2 * Math.PI);
			ctx.stroke();
		}

		//draw hollow circle for Ball's current position on the server
		ctx.strokeStyle = this._sim.color;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(this._serverSim.x - camera.x, this._serverSim.y - camera.y,
			this._serverSim.radius - 1, 0, 2 * Math.PI);
		ctx.stroke();

		//draw solid circle for Ball's current position on the client
		ctx.fillStyle = this._sim.color;
		ctx.beginPath();
		ctx.arc(this._sim.x - camera.x, this._sim.y - camera.y, this._sim.radius, 0, 2 * Math.PI);
		ctx.fill();

		//add entity id on solid circle
		ctx.stroke();
		ctx.fillStyle = '#fff';
		ctx.font="20px Arial";
		ctx.fillText("" + this.entityId, this._sim.x - camera.x - 5, this._sim.y - camera.y + 7);
	};
	return Ball;
});