define([
	'shared/utils/now'
], function(
	now
) {
	return {
		getGameTime: function() {
			return now();
		}
	};
});