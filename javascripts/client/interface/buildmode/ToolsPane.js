define([
	'client/Constants',
	'shared/utils/EventHelper',
	'client/display/Sprite'
], function(
	Constants,
	EventHelper,
	Sprite
) {
	var SPRITE = new Sprite('BuildModeButtons');
	var tool = 'draw-polys';
	var events = new EventHelper([ 'change-tool' ]);
	var buttons = [
		{ frame: 0, mode: 'manipulate' },
		{ frame: 1, mode: 'draw-polys' },
		{ frame: 2, mode: 'doodle'}
	];
	var buttonDownIndex = null;
	var hoverButtonIndex = null;

	//position buttons
	var spacing = 5;
	var buttonWidth = 30;
	var buttonHeight = 30;
	var paneWidth = spacing + (spacing + buttonWidth) * buttons.length;
	var paneHeight = buttonHeight + spacing * 2;
	var paneX = Constants.CANVAS_WIDTH / 2 - paneWidth / 2;
	var paneY = Constants.CANVAS_HEIGHT - paneHeight;
	for(var i = 0; i < buttons.length; i++) {
		buttons[i].x = paneX + spacing + (spacing + buttonWidth) * i;
		buttons[i].y = paneY + spacing;
		buttons[i].width = 30;
		buttons[i].height = 30;
	}

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		},
		getActiveTool: function() {
			return tool;
		},
		reset: function() {
			tool = 'draw-polys';
			buttonDownIndex = null;
			hoverButtonIndex = null;
		},
		onMouseEvent: function(evt, camera) {
			//we might be hovering over / pressing a change-tool button
			for(var i = 0; i < buttons.length; i++) {
				if(buttons[i].x <= evt.x && evt.x <= buttons[i].x + buttons[i].width &&
					buttons[i].y <= evt.y && evt.y <= buttons[i].y + buttons[i].height) {
					//we are hovering over the button
					hoverButtonIndex = i;

					//and pushing down on a button
					if(evt.type === 'mousedown') {
						buttonDownIndex = i;
					}

					//and releasing a button (may cause a mode change)
					else if(evt.type === 'mouseup') {
						if(buttonDownIndex === i && tool !== buttons[i].mode) {
							tool = buttons[i].mode;
							events.trigger('change-tool', tool);
						}
					}

					//return true indicating this mouse event should not bubble up
					return true;
				}
			}

			//if we released the mouse not over a button, it just reverts to its unpressed state
			if(evt.type === 'mouseup') {
				buttonDownIndex = null;
			}

			//we weren't hovering over any buttons
			hoverButtonIndex = null;

			//return false so that this mouse event is passed to other tools
			return false;
		},
		onKeyboardEvent: function(evt, keyboard) {
			//keys 1-3 are quick keys for the buttons
			if(evt.key === 'BUILD_MODE_1' && evt.isDown) {
				if(tool !== 'manipulate') {
					tool = 'manipulate';
					events.trigger('change-tool', tool);
				}
				return true;
			}
			else if(evt.key === 'BUILD_MODE_2' && evt.isDown) {
				if(tool !== 'draw-polys') {
					tool = 'draw-polys';
					events.trigger('change-tool', tool);
				}
				return true;
			}
			else if(evt.key === 'BUILD_MODE_3' && evt.isDown) {
				if(tool !== 'doodle') {
					tool = 'doodle';
					events.trigger('change-tool', tool);
				}
				return true;
			}
		},
		render: function(ctx, camera) {
			//draw pane
			ctx.fillStyle = '#fff';
			ctx.fillRect(paneX, paneY, paneWidth, paneHeight);

			//draw buttons
			for(i = 0; i < buttons.length; i++) {
				var frame = buttons[i].frame;
				if(tool === buttons[i].mode) {
					frame += (hoverButtonIndex === i ? 4 * 6 : 5 * 6);
				}
				else if(buttonDownIndex === i) {
					frame += (hoverButtonIndex === i ? 2 * 6 : 3 * 6);
				}
				else {
					frame += (hoverButtonIndex === i ? 0 * 6 : 1 * 6);
				}
				SPRITE.render(ctx, null, buttons[i].x, buttons[i].y, frame, false);
			}
		}
	};
});