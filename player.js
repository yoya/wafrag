"use strict";
/*
  +----------------------------------------------------------------------+
  | (c) 2013/09/10- yoya@awm.jp                                          |
  +----------------------------------------------------------------------+
*/
(function() {
    var WAPlayer = function(audioctx) {
        this.audioctx = audioctx;
        this.score = []; // [{time, midichunk}, {...}, ...]
        this.synth = new WASynth(audioctx);
        this.division = null;
        this.playing = false;
        this.advance = 0;
        this.advanceOffset = 0;
        this.tempo = 0.5; // T120
        this.advanceListeners = [];
        this.noteListeners = [];
        this.metaListeners = [];
        this.sysexListeners = [];
    }
    WAPlayer.prototype = {
        getVariableLengthValue: function(bin) { // for SMF tokenizer
            var ret_value = 0;
            while (true) {
                var value = bin.getUI8();
                if (value & 0x80) {
                    ret_value += value & 0x7f;
                } else {
                    ret_value += value;
                    break;
                }
                ret_value <<= 7;
            }
            return ret_value;
        },
        loadSMF: function(smfbuffer) {
            var tracks = [];
            var smfdata = new Uint8Array(smfbuffer);
            var bin = new Bin(smfdata, smfbuffer.byteLength);
            // Header
            if (bin.getString(4) !== 'MThd') {
                console.error("no MThd chunk");
                return false;
            }
            var headerLength = bin.getUI32BE();
            var format   = bin.getUI16BE();
            var nTracks  = bin.getUI16BE();
            this.division = bin.getSI16BE();
            var offset = 4 + 4 + headerLength;
            bin.setByteOffset(offset);
            // Tracks
//            for (var i = 0 ; i < nTracks ; i++) {
            while (bin.hasNextData(8)) {
		var chunkSig = bin.getString(4);
                if ((chunkSig !== 'MTrk') &&
		    (chunkSig !== 'XFIH') && (chunkSig !== 'XFKM')) {
                    console.error("no MTrk,XFIH,XFKM chunk:"+chunkSig);
		    break;
                }
                console.debug("chunk:"+chunkSig);
                var trackLength = bin.getUI32BE();
                var nextOffset = offset + 4 + 4 + trackLength;
                // chunk tokenize
                var track = [];
                var advance = 0;
                var runningStatus = null;
                while (bin.getByteOffset() < nextOffset) {
                    var delta = this.getVariableLengthValue(bin);
                    var status = bin.getUI8();
                    if (status < 0x80) {
                        status = runningStatus;
                        bin.incrementOffset(-1);
                    } else {
                        runningStatus = status;
                    }
//		    if (status === 0xFF) { // MetaEvent
//			delta = 0;
//		    }
                    advance += delta;
                    var type = status >> 4;
                    var midi = [status];
                    if (type < 0xF) {
                        var midilen;
                        switch (type) {
                        case 0x8: // Note Off
                        case 0x9: // Note On
                        case 0xA: // Note Aftertouch Event
                        case 0xB: // Control Change
                        case 0xE: // Pitch Bend Event
//                            console.log(bin.getUI8().toString(16));
                            midi.push(bin.getUI8(), bin.getUI8());
                            break;
                        case 0xC: // Program Change
                        case 0xD: // Channel Aftertouch Event
                            midi.push(bin.getUI8());
                            break;
                        }
                    } else { // Meta Eent or System Exclusive
                        var type2 = status & 0x0f;
                        if (type2 === 0xF) { // Meta Event
                            var metatype = bin.getUI8();
                            midi.push(metatype);
                        }
                        var o1 = bin.getByteOffset();
                        var len = this.getVariableLengthValue(bin);
                        var next = bin.getByteOffset() + len;
                        bin.setByteOffset(o1);
                        for (var j = o1; j < next ; j++) {
                            midi.push(bin.getUI8());
                        }
                    }
//                    console.debug(midi);
                    tracks.push( {delta:delta, advance:advance, midi:midi} );
                }
                offset = nextOffset;
                bin.setByteOffset(offset);
            }
            this.score = tracks.sort(
                function(a, b) { return (a['advance']<b['advance'])?-1:((a['advance']==b['advance'])?0:1); }
            );
//            console.debug(this.score);
            tracks = null;
        },
        play: function() {
            if (this.playing) {
                console.debug("already playing");
                return false;
            }
            this.advanceOffset = 0;
            this.advance = 0;
            this.playing = true;
            this.play2();
            return true;
        },
        play2: function() {
            if (this.playing === false) { return false; }
            var currentTime = this.audioctx.currentTime;
            var _currentTime = new Date()*1;
            var score = this.score;
            var scoreLength = this.score.length;
            var currentAdvance = this.advance;
//            console.debug("currentAdvance:"+currentAdvance);
            for (var i = 0, n = this.advanceListeners.length; i < n ; i++) {
                this.advanceListeners[i].handleAdvance(currentAdvance, score[scoreLength - 1].advance);
            }
            for (var o = this.advanceOffset ; (o < scoreLength) && (score[o].advance <= currentAdvance) ; o++) {
                var midi = score[o].midi;
//                console.debug(midi);
                if ((midi[0] & 0xf0) < 0xf0) {
                    /* for MIDI link
                    midi = midi.map(function(x) { return x.toString(16); });
                    midi.unshift('midi');
                    midi = midi.join(',');
                    */
                    this.synth.post(midi);
                    for (var i = 0, n = this.noteListeners.length; i < n ; i++) {
                        this.noteListeners[i].handleNote(midi);
                    }
                } else {
                    if ((midi[0] & 0x0f) === 0x0f) { // Meta Event
                        switch (midi[1]) { // Meta Event Type
                        case 0x51:
                            var tempo = 0x100*(0x100*midi[3] + midi[4])+midi[5]; // usec
                            this.tempo = tempo / 1000000; // seconds
                            console.debug("tempo:"+this.tempo);
                            break;
                        }
			for (var i = 0, n = this.metaListeners.length; i < n ; i++) {
                            this.metaListeners[i].handleMeta(midi);
			}
                    } else { // System Exclusive
			for (var i = 0, n = this.sysexListeners.length; i < n ; i++) {
                            this.sysexListeners[i].handleSysEx(midi);
			}
                    }
                }
            }
            var nextOffset = o;
            if (nextOffset  < scoreLength) {
                var nextAdvance = score[o].advance;
                var delta =  nextAdvance - currentAdvance;
                var deltaSecs = 1000 * delta * this.tempo /  this.division;
//                console.debug('delta:'+delta+" nextAdvance:"+nextAdvance+" currentAdvance:"+currentAdvance);
//                console.debug('tempo:'+this.tempo);
//                console.debug('division:'+this.division);
//                console.debug('wait for '+deltaSecs/1000+"[secs]");
		var elapse = (this.audioctx.currentTime - currentTime);
		var _elapse = (new Date()*1) - _currentTime;
		if (elapse !== 0) {
		    console.log('elapse:'+elapse);
		    console.log(new Date()*1);
		    console.log('_elapse:'+_elapse);
		}
		deltaSecs -= elapse*1000;
		if (deltaSecs < 0) {
		    console.log('deltaSecs:'+deltaSecs);
		}
                setTimeout(this.play2.bind(this), (deltaSecs<=0)?0:deltaSecs);
            } else {
                this.stop();
            }
            this.advanceOffset = nextOffset;
            this.advance = nextAdvance;
            return true;
        },
        stop: function() {
            this.playing = false;
            this.advanceOffset = 0;
            this.advance = 0;
            this.synth.soundOff();
            return true;
        },
        suspend: function() {
            this.playing = false;
            this.synth.soundOff();
            return true;
        },
        resume: function() {
            this.playing = true;
            this.play2();
            return true;
        },
        addAdvanceListener: function(handler) {
            console.debug("addAdvanceListener");
            this.advanceListeners.push(handler);
        },
        addNoteListener: function(handler) {
	    console.debug("addNoteListener");
            this.noteListeners.push(handler);
        },
        addMetaListener: function(handler) {
	    console.debug("addMetaListener");
            this.metaListeners.push(handler);
        },
        addSysExListener: function(handler) {
	    console.debug("addSysExListener");
            this.sysexListeners.push(handler);
        },
    },
    window.WAPlayer = WAPlayer;
})();
