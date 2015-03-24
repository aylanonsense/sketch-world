define([
	'shared/utils/now'
], function(
	now
) {
	return {
		getGameTime: function() {
			return now();
		},
		getTravelTimeToServer: function() {
			return 0.0;
		}
	};
});