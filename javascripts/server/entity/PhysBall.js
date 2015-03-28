define([
	'shared/entity/PhysBall',
	'server/net/GameConnectionServer'
], function(
	PhysBallSim,
	GameConnectionServer
) {
	var nextEntityId = 0;
	function PhysBall(x, y) {
		this.entityId = nextEntityId++;
		this._sim = new PhysBallSim();
		this._sim.pos.set(x, y);
	}
	PhysBall.prototype.getState = function(state) {
		return {
			id: this.entityId,
			type: 'PhysBall',
			state: this._sim.getState()
		};
	};
	PhysBall.prototype.onInputFromClient = function(input, details) {
		var self = this;
		this._sim.onInput(input, details);
		GameConnectionServer.forEach(function(conn) {
			conn.bufferSend({
				messageType: 'player-input',
				entityId: self.entityId,
				input: input,
				details: details
			});
		});
	};
	PhysBall.prototype.tick = function(t) {
		this._sim.tick(t);
	};
	return PhysBall;
});