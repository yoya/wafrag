"use strict";
/*
  +----------------------------------------------------------------------+
  | (c) 2014/02/09- yoya@awm.jp                                          |
  +----------------------------------------------------------------------+
*/
(function() {
    var canvas = null;
    var ctx = null;
    var advance = null;
    var lastAdvance = null;
    var noteWeightList = new Uint8Array(16);
    var noteCountList = new Uint8Array(16);
    var WAProgress = function(canvas_id) {
	this.canvas = document.getElementById(canvas_id);
	this.ctx = this.canvas.getContext('2d');
    }
    WAProgress.prototype = {
        init: function() {
            var ctx = this.ctx;
            ctx.fillStyle = "rgb(70,30,40)";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        },
        handleAdvance: function(adv, lastAdv) {
	    advance = adv;
	    lastAdvance = lastAdv;
            status(advance + "/" + lastAdvance)
	    for (var i = 0 ; i < 16 ; i++) {
		noteWeightList[i] = 0;
		noteCountList[i] = 0;
	    }
        },
        handleNote: function(midi) {
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
	fill: function(channel, h, l, s) {
	    var ctx = this.ctx;
	    h = h % 360;
	    s = (s<100)?(s|0):100;
	    l = (l<100)?(l|0):100;
            ctx.fillStyle = "hsl("+h+","+s+"%,"+l+"%)";
	    var x = advance / lastAdvance * this.canvas.width;
	    var y = channel * this.canvas.height / 16;
            this.ctx.fillRect(x, y, 1, 1);
	},
	noteOn: function(channel, key, velocity) {
	    if (velocity == 0) {
		return this.noteOff(channel, key, velocity);
	    }
	    noteWeightList[channel] += velocity;
	    noteCountList[channel] += 1;
	    var weight = noteWeightList[channel] / noteCountList[channel];
	    var h = 150 + 360*channel/16 * 11;
	    var s = 20 + 60 * weight/127;
	    var l = 30 + 60 * weight/127;
	    this.fill(channel, h, s, l);
	},
	noteOff: function(channel, key, velocity) {
	    //
	},
    }
    window.WAProgress = WAProgress;
})();
