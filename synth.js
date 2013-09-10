"use strict";
/*
  +----------------------------------------------------------------------+
  | (c) 2013/09/10- yoya@awm.jp                                          |
  +----------------------------------------------------------------------+
*/
(function() {
    var WASynth = function(audioctx) {
        this.audioctx = audioctx;
        this.mainGain = audioctx.createGainNode();
        this.mainGain.gain.value = 0.2; // XXX
        this.mainGain.connect(audioctx.destination);
        var genList = new Array(16);
        for (var i = 0 ; i < 16 ; i++) {
            genList[i] = new WAGen(audioctx, this.mainGain);
        }
        this.genList = genList;
    }
    WASynth.prototype = {
        post: function(midi) {
            midi = midi.split(',');
            console.debug(midi);
            var status = parseInt(midi[1], 16);
            var type = status >> 4;
            if (type < 0xF) {
                var channel = status & 0x0F;
                switch (type) {
                case 0x8: // Note Off
                    console.log("noteOff");
                    this.genList[channel].noteOff(parseInt(midi[2], 16),
                                                  parseInt(midi[3], 16));
                    break;
                case 0x9: // Note On
                    this.genList[channel].noteOn(parseInt(midi[2], 16),
                                                  parseInt(midi[3], 16));
                    break;
                }
            } else {
                var type2 = status & 0x0F;
                ;
            }
        },
        soundOff: function() {
            var genList = this.genList;
            for (var i = 0; i < 16 ; i++) {
                genList[i].noteOffAll();
            }
        }
    }
    window.WASynth = WASynth;
})();
