"use strict";
/*
  +----------------------------------------------------------------------+
  | (c) 2014/02/03- yoya@awm.jp                                          |
  +----------------------------------------------------------------------+
*/
(function() {
//    var canvas = null;
//    var ctx = null;
    var timerId = null;
    var that = null;
    var WANoteflow = function(canvas_id) {
	this.canvas = document.getElementById(canvas_id);
	console.log(canvas_id);
	console.log(this.canvas);
	this.ctx = this.canvas.getContext('2d');
	that = this;
    }
    WANoteflow.prototype = {
        init: function() {
            this.canvas.style.backgroundColor = "rgb(0, 0, 0);";
            var ctx = this.ctx;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
//	    for (var channel = 0 ; channel < 16 ; channel++) {
//		for (var key = 0 ; key < 128 ; key++) {
//		    this.fill(channel, key, 210, 30, 20);
//		}
//	    }
        },
	start: function(fps) {
	    timerId = setInterval(this.scroll, 1000/fps);
	},
	stop: function() {
	    console.debug("noteflow::stop timerId="+timerId);
	    clearInterval(timerId);
	    timerId = null;
	},
	scroll: function() {
	    var width = that.canvas.width, height = that.canvas.height;
	    that.ctx.drawImage(that.canvas, 1, 0, width - 1, height , 0, 0, width -1 , height)
	},
        handleNote: function(midi) {
//	    console.debug(midi);
            var status = midi[0];
            var type = status >> 4;
            var velocity = midi[2];
            if (type < 0xF) {
                var channel = status & 0x0F;
                switch (type) {
                case 0x9: // Note On
		    if (velocity > 0) {
    		       this.noteOn(channel, 127, velocity);
                    }
                    break;
                }
	    }
	},
        handleMeta: function(midi) {
            var type = midi[1];
	    console.debug("noteflow::handleMeta type="+type);
            if (type === 5) { // Lyric type
                this.noteOn(14, 127, 127);
	    }
	},
	keyPosition: function(channel, key) {
	    var x = key * 6;
	    var y = 12 + channel * 26;
	    var octave = (key / 12) | 0;
	    var key_in_octave = key % 12;
	    switch (key_in_octave) {
	    case 11:
		x -= 3;
	    case 10:
		x -= 3;
	    case 9:
		x -= 3;
	    case 8:
		x -= 3;
	    case 7:
		x -= 3;
	    case 6:
		x -= 3;
	    case 5:
	    case 4:
		x -= 3;
	    case 3:
		x -= 3;
	    case 2:
		x -= 3;
	    case 1:
		x -= 3;
	    }
	    x -= octave * 3*10;
	    switch (key_in_octave) {
	    case 1:
	    case 3:
	    case 6:
	    case 8:
	    case 10:
		y -= 11;
	    }

	    return [x, y];
        },
	fill: function(channel, key, h, s, l) {
	    var ctx = this.ctx;
	    var posi = this.keyPosition(channel, key);
	    var size = [5, 10];
	    h = h % 360;
	    s = (s<100)?(s|0):100;
	    l = (l<100)?(l|0):100;
            ctx.fillStyle = "hsl("+h+","+s+"%,"+l+"%)";
            this.ctx.fillRect(posi[0], posi[1], size[0], size[1]);6
	},
	noteOn: function(channel, key, velocity) {
	    if (velocity == 0) {
		return this.noteOff(channel, key, velocity);
	    }
//	    console.debug("WANoteflow::noteOn");
	    var h = 150 + 360*channel/16 * 11;
	    var s = 20 + 60 * velocity/127;
	    var l = 30 + 60 * velocity/127;
	    this.fill(channel, key, h, s, l);
	},
	noteOff: function(channel, key, velocity) {
	    var ctx = this.ctx;
//	    console.debug("WANoteflow::noteOff");
	    var posi = this.keyPosition(channel, key);
            this.fill(channel, key, 210, 30, 20);
	},
    }
    window.WANoteflow = WANoteflow;
})();
