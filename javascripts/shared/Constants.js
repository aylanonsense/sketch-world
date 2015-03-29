define({
	CLIENT_OUTGOING_MESSAGE_BUFFER_TIME: 4 / 60,
	SERVER_OUTGOING_MESSAGE_BUFFER_TIME: 4 / 60,

	//physics vars
	BOUNCE_AMOUNT: 0.0001,
	PLAYER_PHYSICS: {
		JUMP_SPEED: 350,
		JUMP_BRAKE_SPEED: 100,
		GRAVITY: 600,
		STICKY_FORCE: 1,
		MAX_VERTICAL_SPEED: 1500,
		STABILITY_ANGLE: Math.PI / 4,
		GROUND: {
			TURN_AROUND_ACC: 5000,
			SLOW_DOWN_ACC: 1200,
			SPEED_UP_ACC: 1200,
			SOFT_MAX_SPEED: 220,
			MAX_SPEED: 1000
		},
		AIR: {
			TURN_AROUND_ACC: 450,
			SLOW_DOWN_ACC: 150,
			SPEED_UP_ACC: 450,
			SOFT_MAX_SPEED: 300,
			MAX_SPEED: 1000
		},
		SLIDING: {
			TURN_AROUND_ACC: 175,
			SLOW_DOWN_ACC: 0,
			SPEED_UP_ACC: 175,
			SOFT_MAX_SPEED: 400,
			MAX_SPEED: 1000
		}
	},
	GRAPPLE_PHYSICS: {
		MOVE_SPEED: 2000,
		MIN_RADIUS: 1,
		MAX_RADIUS: 24,
		MIN_LENGTH: 50,
		MAX_LENGTH: 300,
		PULL_ACC: 1800,
		SHORTENING_ACC: 150,
	}
});