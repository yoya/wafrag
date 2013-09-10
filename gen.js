"use strict";
/*
  +----------------------------------------------------------------------+
  | (c) 2013/09/10- yoya@awm.jp                                          |
  +----------------------------------------------------------------------+
*/
(function() {
    var musicScaleTable;
    if (! musicScaleTable) { // singleton ???
        musicScaleTable = new Float32Array(128);
        var root12 = Math.pow(2, 1/12);
        musicScaleTable[69] = 440; // [Hz] A4
        for (var i = 69 ; i < 127; i++) {
            musicScaleTable[i + 1] = musicScaleTable[i] * root12;
        }
        for (var i = 69 ; 0 < i; i--) {
            musicScaleTable[i - 1] = musicScaleTable[i] / root12;
        }
    }
    var WAGen = function(audioctx, mainGain) {
        this.audioctx = audioctx;
        this.mainGain = mainGain;
        this.gainTable = new Array(128);
        this.oscTable = new Array(128);
        this.bank = 0;
        this.program = 0;
    }
    WAGen.prototype = {
        programChange: function(program) {
            this.program = program;
        },
        noteOn: function(key, velocity) {
            if (velocity === 0) {
                return this.noteOff(key, velocity);
            }
            console.debug("WAGen::noteOn key:"+key+" velocity:"+velocity);
            var freq = musicScaleTable[key];
            if (! this.oscTable[key]) {
                var gain = this.audioctx.createGainNode();
                gain.gain.value = velocity / 128;
                gain.connect(this.mainGain);
                var osc = this.audioctx.createOscillator();
                osc.frequency.value = freq;
                osc.connect(gain);
                osc.noteOn(0);
                this.oscTable[key] = osc;
                this.gainTable[key] = gain;
            }
        },
        noteOff: function(key, valocity) {
            if (! this.oscTable[key]) {
                console.debug("noteOff failed: key:"+key);
                return ; // skip
            }
            this.oscTable[key].noteOff(0);
            this.gainTable[key].disconnect(this.mainGain);
            this.oscTable[key].disconnect(this.gainTable[key]);
            this.oscTable[key] = undefined;
            this.gainTable[key] = undefined;
        },
        noteOffAll: function() {
            var oscTable = this.oscTable;
            for (var key = 0; key < 128 ; key++) {
                if (oscTable[key]) {
                    noteOff(key, 0);
                }
            }

            
        }
    }
    window.WAGen = WAGen;
})();
