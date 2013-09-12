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
        this.mainGain.gain.value = 0.3; // XXX
        this.mainGain.connect(audioctx.destination);
        var genList = new Array(16);
        for (var i = 0 ; i < 16 ; i++) {
            genList[i] = new WAGen(audioctx, this.mainGain);
        }
        this.genList = genList;
    }
    WASynth.prototype = {
        post: function(midi) {
            /* for MIDI link
            midi = midi.split(',');
            if (midi[0] !== 'midi') {
                return false; // skip
            }
            midi.shift();
            midi = midi.map(function(n) { return parseInt(n, 16); });
            */
            var status = midi[0];
            var type = status >> 4;
            if (type < 0xF) {
                var channel = status & 0x0F;
                if (channel === 9) { // percussion part
                    return false; // skip , now ignore sorry.
                }
                switch (type) {
                case 0x8: // Note Off
                    console.debug("WASynth channel:"+channel+" WSGen::noteOff key:"+midi[1]+" velocity:"+midi[2]);
                    this.genList[channel].noteOff(midi[1], midi[2]);
                    break;
                case 0x9: // Note On
                    console.debug("WASynth channel:"+channel+" WSGen::noteOn key:"+midi[1]+" velocity:"+midi[2]);
                    this.genList[channel].noteOn(midi[1], midi[2]);
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
