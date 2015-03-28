define([
	'shared/utils/now'
], function(
	now
) {
	var frame = 0;

	return {
		getGameTime: function() {
			return now();
		},
		getFrame: function() {
			return frame;
		},
		incrementFrame: function() {
			frame++;
		}
	};
});