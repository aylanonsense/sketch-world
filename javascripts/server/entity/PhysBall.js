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
		this.sim = new PhysBallSim();
		this.sim.pos.set(x, y);
	}
	PhysBall.prototype.getState = function(state) {
		return {
			id: this.entityId,
			type: 'PhysBall',
			state: this.sim.getState()
		};
	};
	PhysBall.prototype.setState = function(state) {
		this.sim.setState(state);
	};
	PhysBall.prototype.onInputFromClient = function(input, details) {
		var self = this;
		this.sim.onInput(input, details);
		GameConnectionServer.forEach(function(conn) {
			conn.bufferSend({
				messageType: 'player-input',
				entityId: self.entityId,
				input: input,
				details: details
			});
		});
	};
	PhysBall.prototype.startOfFrame = function(t) {
		this.sim.startOfFrame(t);
	};
	PhysBall.prototype.tick = function(t) {
		this.sim.tick(t);
	};
	PhysBall.prototype.endOfFrame = function(t) {
		this.sim.endOfFrame(t);
	};
	return PhysBall;
});