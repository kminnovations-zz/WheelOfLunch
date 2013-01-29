function Wheel(containerId, restaurants, settings) {

	this.getMagnitude = function(p) {
		return Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2));
	}

	this.getDotProduct = function(p0, p1) {
		return p0.x * p1.x + p0.y * p1.y;
	}

	this.applySettings = function (settings) {

		if (!settings) {
			settings = {};
		}
		this.settings = {};

		this.settings.width = settings.width ? settings.width : 760;
		this.settings.height = settings.height ? settings.height : 300;
		this.settings.arrowHeight = settings.arrowHeight ? settings.arrowHeight : 29;

		this.settings.wheelCentre = {
			x: this.settings.width / 2,
			y: null // calculate a bit further down
		};

		// The top of the wheel
		var wheelTop = {
			x: this.settings.wheelCentre.x,
			y: this.settings.arrowHeight * 0.65
		};

		if (this.settings.height * 2 + wheelTop.y >= this.settings.width) {
			this.settings.wheelCentre.y = wheelTop.y + this.settings.width / 2;
		} else {
			// Where the wheel meets the bottom left corner of the visible area
			// Vector from where the wheel meets the left corner of the visible area to
			// the middle of the visible area
			var p0 = { x: this.settings.wheelCentre.x, y: this.settings.height - wheelTop.y };
			// Where middle of 
			var p1 = { x: this.settings.wheelCentre.x, y: 0 };

			// The angle around the bottom left corner of the visible area from p1 to p0
			var arcAngle = Math.PI / 2 - Math.acos(this.getDotProduct(p0, p1) / (this.getMagnitude(p0) * this.getMagnitude(p1)));
			// The angle around the centre of the wheel from the top of the wheel to
			// the bottom left corner of the visible area
			var cornerAngle = Math.PI - 2 * arcAngle;

			this.settings.wheelCentre.y = this.settings.height + this.settings.wheelCentre.x / Math.tan(cornerAngle);
		}

		this.settings.radiusOuter = this.settings.wheelCentre.y - wheelTop.y;
		this.settings.radiusText = this.settings.radiusOuter * 0.9;
		this.settings.radiusInner = this.settings.radiusOuter * 0.75;

		this.settings.updateRate = settings.updateRate ? settings.updateRate : 30;

		this.settings.spinSecondsMin = settings.spinSecondsMin ? settings.spinSecondsMin : 6;
		this.settings.spinSecondsMax = settings.spinSecondsMax ? settings.spinSecondsMax : 8;

		this.settings.spinRotationsMin = settings.spinRotationsMin ? settings.spinRotationsMin : 1;
		this.settings.spinRotationsMax = settings.spinRotationsMax ? settings.spinRotationsMax : 2;

		this.settings.colours = settings.colours ? settings.colours :
			[
				"#C9DE63",
				"#6BC973",
				"#41B2AB",
				"#6740D8",
				"#626097",
				"#8D6B9E",
				"#D83F94",
				"#F94057",
				"#F68457",
				"#FCB33F",
				"#FFD83F",
				"#FEF53F"
			];

		this.settings.showProgress = true;
	};

	this.applySettings(settings);

	this.isSpinning = false;

	this.containerId = containerId;

	this.container = $('#' + containerId);
	this.container.append('<canvas style="border-width:1px;border-style:solid;border-color:#cccccc;" class="canvas" width="' + this.settings.width + '" height="' + this.settings.height + '" ></canvas>');
	this.canvas = $('#' + containerId + ' .canvas').get(0);

	if (this.settings.showProgress == true) {
		this.container.append('<div class="progress progress-striped active" style="margin:0 auto;width:' + this.settings.width + 'px;"><div class="bar" style="width: 0%;"></div></div>');
		this.progresscontainer = $('#' + containerId + ' .progress').get(0);
		this.progressbar = $('#' + containerId + ' .bar').get(0);
	}

	this.restaurants = restaurants;

	this.currentRotation = 0;

	// Start a new spin
	this.spin = function(restaurants, settings) {

		// If the wheel is spinning already, do nothing
		if (this.isSpinning){
			return;
		}

		if (restaurants) {
			this.restaurants = restaurants;
		}
		if (settings) {
			this.applySettings(settings);
		}

		this.arc = 2 * Math.PI / this.restaurants.length;
		this.isSpinning = true;
		this.spinProgress = 0;
		this.spinAngleStart = this.currentRotation;
		var random = Math.random();
		this.spinTimeTotal = (random * (this.settings.spinSecondsMax - this.settings.spinSecondsMin) + this.settings.spinSecondsMin) * 1000;
		this.spinRotationTotal = (random * (this.settings.spinRotationsMax - this.settings.spinRotationsMin) + this.settings.spinRotationsMin) * 2 * Math.PI;
		this.rotateWheel();
	}

	// Gets a value between initialValue and initialValue+changeInValue.
	// progress is a value between 1 and 0. If values for progress are
	// linear, values for the result will change sharply near initialValue but
	// ease towards initialValue+changeInValue
	this.easeOut = function (progress, initialValue, changeInValue) {
		var easeProgress = 1-Math.pow(1-progress, 3.5);
		return initialValue + changeInValue * easeProgress;
	}

	// Rotates the wheel based on spinProgress
	this.rotateWheel = function () {
		// updates the progress bar
		if (this.progressbar != null) {
			$(this.progressbar).css("width", (this.spinProgress * 120) + "%");
		}

		this.currentRotation = this.easeOut(this.spinProgress, this.spinAngleStart, this.spinRotationTotal);
		this.drawWheel();

		this.spinProgress += this.settings.updateRate / this.spinTimeTotal;

		if (this.spinProgress >= 1.0) {
			this.stopRotateWheel();
			return;
		}

		var _this = this;
		this.spinTimeout = setTimeout(function () { _this.rotateWheel(); }, this.settings.updateRate);
	}

	// Ends a spin and draws the winning item
	this.stopRotateWheel = function () {
		clearTimeout(this.spinTimeout);

		this.context.beginPath();

		// updates the progress bar
		if (this.progressbar != null) {
			$(this.progresscontainer).removeClass('active');
			$(this.progressbar).css("width", "100%");
		}

		var degrees = this.currentRotation * 180 / Math.PI + 90;
		var arcd = this.arc * 180 / Math.PI;
		var index = Math.floor((360 - degrees % 360) / arcd);
		this.context.save();
		this.context.font = 'bold 30px Helvetica, Arial';
		var text = this.restaurants[index];

		var textWidth = this.context.measureText(text).width;
		var textX = this.settings.width / 2 - textWidth / 2;

		this.context.rect(textX - 10, 2 * this.settings.height / 3 - 10, textWidth + 20, 40);
		this.context.fillStyle = "white";
		this.context.fill();

		this.context.fillStyle = "black";
		this.context.fillText(text, textX, 2 * this.settings.height / 3 + 20);

		this.context.lineWidth = 1;
		this.context.strokeStyle = "black";
		this.context.stroke();

		this.context.restore();

		this.isSpinning = false;
	}

	// Draws the wheel based on currentRotation
	this.drawWheel = function() {

		var wheelColours;

		if (this.canvas.getContext) {

			this.context = this.canvas.getContext("2d");
			this.context.clearRect(0, 0, this.settings.width, this.settings.height);

			this.context.strokeStyle = "#303030";
			this.context.lineWidth = 2;
			
			var divisor = this.findEvenDivisor(this.restaurants.length, this.settings.colours.length);
			var wheelColours = this.settings.colours.slice(0, divisor);
			
			for(var i = 0; i < this.restaurants.length; i++) {
				var angle = this.currentRotation + i * this.arc;
				this.context.fillStyle = wheelColours[i % wheelColours.length];
				
				this.context.beginPath();
				this.context.arc(this.settings.wheelCentre.x, this.settings.wheelCentre.y, this.settings.radiusOuter, angle, angle + this.arc, false);
				this.context.arc(this.settings.wheelCentre.x, this.settings.wheelCentre.y, this.settings.radiusInner, angle + this.arc, angle, true);
				this.context.stroke();
				this.context.fill();
				
				this.context.save();
/*
				// Shadows seem like a bad idea when the background colour is always different
				this.context.shadowOffsetX = -1;
				this.context.shadowOffsetY = -1;
				this.context.shadowBlur = 0;
				this.context.shadowColor = "#909090";
*/

				this.context.fillStyle = "#101010";
				// move the text to its spot on the wheel
				this.context.translate(
					this.settings.wheelCentre.x + Math.cos(angle + this.arc / 2) * this.settings.radiusText,
					this.settings.wheelCentre.y + Math.sin(angle + this.arc / 2) * this.settings.radiusText);
				// rotate the text to the same angle as its spot on the wheel
				this.context.rotate(angle + this.arc / 2 + Math.PI / 2);

				var text = this.restaurants[i];
				// Determine a font size appropriate for the text based on length
				var fontSize =
					3
					+
					(this.settings.radiusOuter/16/this.restaurants.length)
					*
					(text.length > 14 ? 5 : text.length < 5 ? 17 : (19 - text.length));

				this.context.font = 'bold ' + (fontSize > 18 ? 18 : fontSize) + 'px Helvetica, Arial';
				this.context.fillText(text, -this.context.measureText(text).width / 2, 0);
				this.context.restore();
			} 

			//Arrow
			this.context.fillStyle = "orange";
			this.context.strokeStyle = "black";
			this.context.lineWidth = 1;

			this.context.beginPath();

			this.context.moveTo(this.settings.wheelCentre.x - 4 * this.settings.arrowHeight / 29, 0);
			this.context.lineTo(this.settings.wheelCentre.x + 4 * this.settings.arrowHeight / 29, 0);
			this.context.lineTo(this.settings.wheelCentre.x + 4 * this.settings.arrowHeight / 29, 12 * this.settings.arrowHeight / 29);
			this.context.lineTo(this.settings.wheelCentre.x + 9 * this.settings.arrowHeight / 29, 12 * this.settings.arrowHeight / 29);
			this.context.lineTo(this.settings.wheelCentre.x + 0 * this.settings.arrowHeight / 29, 24 * this.settings.arrowHeight / 29);
			this.context.lineTo(this.settings.wheelCentre.x - 9 * this.settings.arrowHeight / 29, 12 * this.settings.arrowHeight / 29);
			this.context.lineTo(this.settings.wheelCentre.x - 4 * this.settings.arrowHeight / 29, 12 * this.settings.arrowHeight / 29);
			this.context.lineTo(this.settings.wheelCentre.x - 4 * this.settings.arrowHeight / 29, 0);
			this.context.fill();
			this.context.stroke();
		}
	}

	// Find a divisor for dividend that is no greater than maximumDivisor such that
	// if a set of size dividend is divided into smaller sets of the size of the
	// return value, the remainder group will be near in size to the others.
	this.findEvenDivisor = function(dividend, maximumDivisor) {
		if (dividend <= maximumDivisor)
		{
			return dividend;
		}
		var remainder;
		var lowestDivisor = 0;
		var lowestDivisorIndex = 0;
		for (var i = maximumDivisor; i >= (maximumDivisor/2); i -= 1)
		{
			remainder = dividend % i;
			if (remainder == 0)
			{
				return i;
			}
			else if (remainder > lowestDivisor)
			{
				lowestDivisor = remainder;
				lowestDivisorIndex = i;
			}
		}
		return lowestDivisorIndex;
	}
}
