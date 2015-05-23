define([
	'shared/Constants',
	'shared/level/Level'
], function(
	SharedConstants,
	Level
) {
	return function(entitySim, t) {
		var prevCauses = [];
		for(var i = 0; i < 6; i++) {
			var collision = Level.checkForCollision(entitySim, SharedConstants.BOUNCE_AMT);
			if(collision) {
				entitySim.handleCollision(collision, t);
				if(collision.cause.sameAsAny(prevCauses)) {
					if(!collision.cause.sameAs(prevCauses[prevCauses.length - 1])) {
						entitySim.pos.copy(entitySim.prevPos);
						entitySim.vel.zero();
					}
					break;
				}
				else {
					prevCauses.push(collision.cause);
				}
			}
			else {
				break;
			}
		}
	};
});