define([
	'client/Constants',
	'shared/utils/EventHelper',
	'shared/math/Utils',
	'shared/math/Vector',
	'client/interface/buildmode/ToolsPane',
	'client/interface/buildmode/tool/Manipulate',
	'client/interface/buildmode/tool/DrawPolys',
	'client/interface/buildmode/tool/Doodle',
	'client/display/Sprite'
], function(
	Constants,
	EventHelper,
	MathUtils,
	Vector,
	ToolsPane,
	ManipulateTool,
	DrawPolysTool,
	DoodleTool,
	Sprite
) {
	var activeTool = ToolsPane.getActiveTool();
	var TOOLS = {
		'manipulate': ManipulateTool,
		'draw-polys': DrawPolysTool,
		'doodle': DoodleTool
	};
	var buildModeIsOn = true;
	var events = new EventHelper([ 'draw-polygon', 'move-polygon', 'delete-polygon' ]);

	//bind events
	ToolsPane.on('change-tool', function(tool) {
		activeTool = tool;
		for(var k in TOOLS) {
			TOOLS[k].reset();
		}
	});
	ManipulateTool.on('move-polygon', function(info) {
		events.trigger('move-polygon', info);
	});
	ManipulateTool.on('delete-polygon', function(polygon) {
		events.trigger('delete-polygon', polygon);
	});
	DrawPolysTool.on('draw-polygon', function(partialState) {
		events.trigger('draw-polygon', partialState);
	});

	return {
		isOn: function() {
			return buildModeIsOn;
		},
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		reset: function() {
			ToolsPane.reset();
			activeTool = ToolsPane.getActiveTool();
			for(var k in TOOLS) {
				TOOLS[k].reset();
			}
		},
		toggle: function() {
			buildModeIsOn = !buildModeIsOn;
			if(!buildModeIsOn) {
				for(var k in TOOLS) {
					TOOLS[k].reset();
				}
			}
		},
		onMouseEvent: function(evt, camera) {
			if(!ToolsPane.onMouseEvent(evt, camera)) {
				TOOLS[activeTool].onMouseEvent(evt, camera);
			}
		},
		onKeyboardEvent: function(evt, keyboard) {
			if(!ToolsPane.onKeyboardEvent(evt, keyboard)) {
				TOOLS[activeTool].onKeyboardEvent(evt, keyboard);
			}
		},
		render: function(ctx, camera) {
			if(buildModeIsOn) {
				TOOLS[activeTool].render(ctx, camera);
				ToolsPane.render(ctx, camera);
			}
		}
	};
});