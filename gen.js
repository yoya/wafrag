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
        this.noteGCList = [];
        this.gainScale = 0.5;
    }
    WAGen.prototype = {
        programChange: function(program) {
            this.program = program;
        },
        noteOn: function(key, velocity) {
            if (velocity === 0) {
                return this.noteOff(key, velocity);
            }
            var freq = musicScaleTable[key];
            var currentTime;
            currentTime = this.audioctx.currentTime;
            if (! this.oscTable[key]) {
                var gain = this.audioctx.createGainNode();
                var attack = this.gainScale * velocity / 128;
                var decay = this.gainScale * velocity / 200;
                var sustain = this.gainScale * velocity / 256;
                gain.gain.value = 0;
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(attack,
                                                  currentTime + 0.002);
                gain.gain.linearRampToValueAtTime(decay,
                                                  currentTime + 0.2);
                gain.gain.linearRampToValueAtTime(sustain,
                                                  currentTime + 1);
                gain.connect(this.mainGain);
                var osc = this.audioctx.createOscillator();
                osc.frequency.value = freq;
                osc.connect(gain);
                osc.noteOn(0);
                osc.type = 3; // triangle
                this.oscTable[key] = osc;
                this.gainTable[key] = gain;
            } else {
                this.noteCancelGC(key);
                var gain = this.gainTable[key];
                var attack = this.gainScale * velocity / 128;
                var decay = this.gainScale * velocity / 200;
                var sustain = this.gainScale * velocity / 256;
                gain.gain.cancelScheduledValues(currentTime + 0.001);
                gain.gain.linearRampToValueAtTime(attack,
                                                  currentTime + 0.002);
                gain.gain.linearRampToValueAtTime(decay,
                                                  currentTime + 0.2);
                gain.gain.linearRampToValueAtTime(sustain,
                                                  currentTime + 1);
            }
        },
        noteOff: function(key, valocity) {
            if (! this.oscTable[key]) {
                // console.debug("noteOff failed: key:"+key);
                return ; // skip
            }
            var gain = this.gainTable[key];
            var currentTime = this.audioctx.currentTime;
            var releaseEndTime = currentTime + 0.5;
            gain.gain.cancelScheduledValues(releaseEndTime - 0.001);
            gain.gain.linearRampToValueAtTime(0,
                                              releaseEndTime);
            this.noteAppendGC(releaseEndTime, key);
            var elapse = (releaseEndTime - currentTime) * 1000;
            setTimeout(this.noteProcessGC.bind(this), elapse + 0.1);
            // this.noteProcessGC();
        },
        noteAppendGC: function(releaseEndTime, key) {
            this.noteGCList.push( [releaseEndTime, key] );
//            console.debug("append noteGCList:"+this.noteGCList.map(function(x) { return x[1]; }).join(','));
        },
        noteCancelGC: function(key) {
  //          console.debug('noteCancelGC key:'+key);
            var noteGCList = this.noteGCList;
            for (var i = 0, n = noteGCList.length ; i < n ; i++) {
                if (noteGCList[i][1] === key) {
//                    console.debug("GCcancel key:"+key);
                    this.noteGCList.splice(i, 1);
//                    console.debug("Cancel:: noteGCList:"+this.noteGCList.map(function(x) { return x[1]; }).join(','));
                    return true;
                }
            }
            return false;
        },
        noteProcessGC: function() {
            var noteGCList = this.noteGCList;
            var i, n;
            for (i = 0, n = noteGCList.length ; i < n ; i++) {
                var note = noteGCList[i];
                if (this.audioctx.currentTime < note[0]) {
                    break;
                }
                var key = note[1];
//                console.debug("GC key:"+key);
                if (this.oscTable[key]) { // fpr noteOn,Off,Off pattern
                    var osc = this.oscTable[key];
                    var gain = this.gainTable[key];
                    osc.noteOff(0);
                    gain.disconnect(this.mainGain);
                    osc.disconnect(this.gainTable[key])
                    this.oscTable[key] = undefined;
                    this.gainTable[key] = undefined;
                }
            }
            if (0 < i) {
                var a = this.noteGCList.length;
                this.noteGCList.splice(0, i);
                var b = this.noteGCList.length;
//                console.debug("process noteGCList:"+this.noteGCList.map(function(x) { return x[1]; }).join(','));
            }
            return ;
        },
        noteOffAll: function() {
            var oscTable = this.oscTable;
            for (var key = 0; key < 128 ; key++) {
                if (oscTable[key]) {
                    this.noteOff(key, 0);
                }
            }
        }
    }
    window.WAGen = WAGen;
})();
