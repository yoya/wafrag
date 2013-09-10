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
    }
    WAPlayer.prototype = {
        getVariableLengthValue: function(bin) { // for SMF tokenizer
            var ret_value = 0;
            while (true) {
                var value = bin.getUI8();
                if (value & 0x80) {
                    ret_value = (ret_value << 7) + (value & 0x7f);
                } else {
                    ret_value = (ret_value << 7) + value;
                    break;
                }
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
            for (var i = 0 ; i < nTracks ; i++) {
//                console.debug("track i:"+i);
                if (bin.getString(4) !== 'MTrk') {
                    console.error("no MTrk chunk");
                    return false;
                }
                var trackLength = bin.getUI32BE();
                var nextOffset = offset + 4 + 4 + trackLength;
                // chunk tokenize
                var track = [];
                var advance = 0;
                var runningStatus = null;
                while (bin.getByteOffset() < nextOffset) {
                    var delta = this.getVariableLengthValue(bin);
                    advance += delta;
                    var status = bin.getUI8();
                    if (status < 0x80) {
                        status = runningStatus;
                        bin.incrementOffset(-1);
                    } else {
                        runningStatus = status;
                    }
                    var type = status >> 4;
                    var midi = 'midi,'+status.toString(16);
                    if (type < 0xF) {
                        var midilen;
                        switch (type) {
                        case 0x8: // Note Off
                        case 0x9: // Note On
                        case 0xA: // Note Aftertouch Event
                        case 0xB: // Control Change
                        case 0xE: // Pitch Bend Event
//                            console.log(bin.getUI8().toString(16));
                            midi += ","+bin.getUI8().toString(16)+","+bin.getUI8().toString(16);
                            break;
                        case 0xC: // Program Change
                        case 0xD: // Channel Aftertouch Event
                            midi += ","+bin.getUI8().toString(16);
                            break;
                        }
                    } else { // Meta Eent or System Exclusive
                        var type2 = status & 0x0f;
                        var metatype = bin.getUI8();
                        midi += ','+metatype.toString(16);
                        var o1 = bin.getByteOffset();
                        var len = this.getVariableLengthValue(bin);
                        var next = bin.getByteOffset() + len;
                        bin.setByteOffset(o1);
                        for (var j = o1; j < next ; j++) {
                            midi += ','+bin.getUI8().toString(16);
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
            tracks = null;
        },
        play: function() {
            if (this.playing) {
                console.debug("already playing");
                return ;
            }
            this.playing = true;
            this.play2();
        },
        play2: function() {
            if (this.playing === false) { return false; }

            var score = this.score;
            var scoreLength = this.score.length;
            var currentAdvance = this.advance;
            console.debug("currentAdvance:"+currentAdvance);
            for (var o = this.advanceOffset ; (o < scoreLength) && (score[o].advance <= currentAdvance) ; o++) {
                this.synth.post(score[o].midi);
            }
            var nextOffset = o;
            if (nextOffset  < scoreLength) {
                var nextAdvance = score[o].advance;
                var delta =  nextAdvance - currentAdvance;
                var deltaSecs = 1000 * delta * this.tempo /  this.division;
                setTimeout(this.play2.bind(this), deltaSecs);
//                setTimeout(this.play2.bind(this), 1000);
                //
            } else {
                this.playing = false;
                var nextAdvance = -1;
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
        },
        suspend: function() {
            this.playing = false;
            this.synth.soundOff();
        },
        resume: function() {
            this.playing = true;
            this.play2();
        },
    },
    window.WAPlayer = WAPlayer;
})();
