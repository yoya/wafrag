"use strict";
/*
  +----------------------------------------------------------------------+
  | (c) 2014/02/03- yoya@awm.jp                                          |
  +----------------------------------------------------------------------+
*/
(function() {
    var canvas = null;
    var ctx = null;
    var WAKeyboard = function(canvas_id) {
	this.canvas = document.getElementById(canvas_id);
	console.log(canvas_id);
	console.log(this.canvas);
	this.ctx = this.canvas.getContext('2d');
    }
    WAKeyboard.prototype = {
        init: function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
        handle: function(midi) {
//	    console.debug(midi);
            var status = midi[0];
            var type = status >> 4;
            if (type < 0xF) {
                var channel = status & 0x0F;
                switch (type) {
                case 0x8: // Note Off
		    this.noteOff(channel, midi[1], midi[2]);
                    break;
                case 0x9: // Note On
		    this.noteOn(channel, midi[1], midi[2]);
                    break;
		}
	    }
	},
	keyPosition: function(channel, key) {
	    var x = key * 7;
	    var y = channel * 20;
	    return [x, y];
        },
	fill: function(channel, key, fillStyle) {
	    var ctx = this.ctx;
	    var posi = this.keyPosition(channel, key);
	    var size = [5, 10];
            ctx.fillStyle = fillStyle;
	    ctx.beginPath();
	    ctx.moveTo(posi[0], posi[1]);
	    ctx.lineTo(posi[0]+size[0], posi[1]);
	    ctx.lineTo(posi[0]+size[0], posi[1]+size[1]);
	    ctx.lineTo(posi[0], posi[1]+size[1]);
	    ctx.fill();
	},
	noteOn: function(channel, key, velocity) {
	    if (velocity == 0) {
		return this.noteOff(channel, key, velocity);
	    }
//	    console.debug("WAKeyboard::noteOn");
	    this.fill(channel, key, "rgb(100, 155, 155");
	},
	noteOff: function(channel, key, velocity) {
	    var ctx = this.ctx;
//	    console.debug("WAKeyboard::noteOff");
	    var posi = this.keyPosition(channel, key);
	    this.fill(channel, key, "rgb(200, 200, 200");
	},
    }
    window.WAKeyboard = WAKeyboard;
})();
