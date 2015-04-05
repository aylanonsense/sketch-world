define([
	'client/Constants',
	'client/display/sprite-config'
], function(
	Constants,
	config
) {
	var IMAGES = {};

	function Sprite(key) {
		if(!config[key]) {
			throw new Error("There does not exist a spritesheet with an id of '" + key + "'");
		}

		//init private vars
		this._canvas = null;
		this._loaded = false;
		this._scale = config[key].scale || 1;
		this._preLoadedColor = config[key].loadingColor || '#fff';
		this._flipped = config[key].flip || false;
		this._replacements = config[key].replacements || null;
		this._crop = config[key].crop || null;
		this._outlineInDebugMode = config[key].outlineInDebugMode !== false;
		this._frameWidth = this._scale * config[key].width; //width of one frame
		this._frameHeight = this._scale * config[key].height; //height of one frame
		this._isTrimmed = !!config[key].trim;
		this._offsetX = (this._isTrimmed ? this._scale * config[key].trim.x : 0);
		this._offsetY = (this._isTrimmed ? this._scale * config[key].trim.y : 0);

		//init public vars
		this.width = (this._isTrimmed ? this._scale * config[key].trim.width : this._frameWidth);
		this.height = (this._isTrimmed ? this._scale * config[key].trim.height : this._frameHeight);
		this.key = key;

		//if the image isn't loaded... well, we need to load it
		var imagePath = config[key].imagePath;
		if(!IMAGES[imagePath]) {
			var image = new Image();
			IMAGES[imagePath] = {
				imageData: null,
				width: null,
				height: null,
				waitingOnLoad: [ this ]
			};
			//when it's done loading, give the image data to everything waiting on it
			image.onload = function() {
				//copy the image onto a canvas to get image data out of it
				var canvas = document.createElement('canvas');
				canvas.width = image.width;
				canvas.height = image.height;
				var ctx = canvas.getContext('2d');
				ctx.drawImage(image, 0, 0);
				IMAGES[imagePath].imageData = ctx.getImageData(0, 0, image.width, image.height).data;
				IMAGES[imagePath].width = image.width;
				IMAGES[imagePath].height = image.height;
				//inform every spritesheet that relies on this image that it is loaded
				for(var i = 0; i < IMAGES[imagePath].waitingOnLoad.length; i++) {
					IMAGES[imagePath].waitingOnLoad[i].onImageLoaded(IMAGES[imagePath].imageData,
							IMAGES[imagePath].width, IMAGES[imagePath].height);
				}
				delete IMAGES[imagePath].waitingOnLoad;
			};
			image.src = imagePath;
		}
		//if it's loading, add this spritesheet to the list of things to be notified when it's loaded
		else if(!IMAGES[imagePath].imageData) {
			IMAGES[imagePath].waitingOnLoad.push(this);
		}
		//if it's done loading, great, now we can manipulate it according to the sprite
		else {
			this.onImageLoaded(IMAGES[imagePath].imageData,
					IMAGES[imagePath].width, IMAGES[imagePath].height);
		}
	}
	Sprite.prototype.onImageLoaded = function(imageData, imageWidth, imageHeight) {
		//we need to adjust things if the image is cropped
		var minX = (this._crop && this._crop.x) || 0;
		var minY = (this._crop && this._crop.y) || 0;
		var maxX = (this._crop && this._crop.x + this._crop.width) || imageWidth;
		var maxY = (this._crop && this._crop.y + this._crop.height) || imageHeight;
		var width = (this._crop && this._crop.width) || imageWidth;
		var height = (this._crop && this._crop.height) || imageHeight;
		//create another canvas, scaled as needed
		this._canvas = document.createElement('canvas');
		this._canvas.width = this._scale * width;
		this._canvas.height = this._scale * height * (this._flipped ? 2 : 1);
		var ctx = this._canvas.getContext('2d');
		//transfer image data from the first canvas onto the scaled canvas
		var i = 4 * (minY * imageWidth + minX);
		for(var y = minY; y < maxY; y++) {
			for(var x = minX; x < maxX; x++) {
				//fill the scaled pixel
				var r = imageData[i++], g = imageData[i++],
					b = imageData[i++], a = imageData[i++] / 100.0;
				ctx.fillStyle = 'rgba(' + [r, g, b, a].join(',') + ')';
				if(this._replacements) {
					var hex = rgbToHex(r, g, b);
					if(this._replacements[hex]) {
						ctx.fillStyle = this._replacements[hex];
					}
				}
				ctx.fillRect(this._scale * (x - minX), this._scale * (y - minY),
					this._scale, this._scale);
				if(this._flipped) {
					//fill the flipped pixel too
					ctx.fillRect(this._canvas.width - this._scale * (x - minX + 1),
						this._canvas.height / 2 + this._scale * (y - minY), this._scale, this._scale);
				}
			}
			i += 4 * (imageWidth - width);
		}
		this._loaded = true;
	};
	Sprite.prototype.render = function(ctx, camera, x, y, frame, flip) {
		x -= (camera && camera.x || 0);
		y -= (camera && camera.y || 0);
		if(!Constants.DEBUG_HIDE_SPRITES) {
			if(this._loaded) {
				var numCols = this._canvas.width / this._frameWidth;
				var numRows = (this._canvas.height / this._frameHeight) / (this._flipped ? 2 : 1);
				//locate the frame on the Sprite
				frame = Math.floor(frame % (numCols * numRows));
				var frameX = frame % numCols;
				var frameY = Math.floor(frame / numCols);
				if(flip && this._flipped) {
					frameX = numCols - frameX - 1;
					frameY += numRows;
				}
				//draw the image
				ctx.drawImage(this._canvas,
					frameX * this._frameWidth,
					frameY * this._frameHeight,
					this._frameWidth,
					this._frameHeight,
					x + (flip ?  this.width + this._offsetX - this._frameWidth : -this._offsetX),
					y - this._offsetY,
					this._frameWidth,
					this._frameHeight
				);
			}
			else {
				//if the image hasn't loaded yet, we just show a colored rectangle
				ctx.fillStyle = this._preLoadedColor;
				ctx.fillRect(x, y, this.width, this.height);
			}
		}
		if(Constants.DEBUG_TRACE_SPRITES) {
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(255, 255, 0, 0.75)';
			ctx.strokeRect(x, y, this.width, this.height);
			if(this._isTrimmed) {
				ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)';
				ctx.strokeRect(
					x + (flip ? this.width + this._offsetX - this._frameWidth : -this._offsetX),
					y - this._offsetY,
					this._frameWidth,
					this._frameHeight
				);
			}
		}
		return {
			width: this._frameWidth,
			height: this._frameHeight,
			top: y,
			bottom: y + this._frameHeight,
			left: x,
			right: x + this._frameWidth,
			center: { x: x + this._frameWidth / 2, y: y + this._frameHeight / 2 }
		};
	};

	//helper methods
	function rgbToHex(r, g, b) {
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}
	function componentToHex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}

	return Sprite;
});