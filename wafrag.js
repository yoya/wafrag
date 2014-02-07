"use strict";
/*
  +----------------------------------------------------------------------+
  | (c) 2013/09/09- yoya@awm.jp                                          |
  +----------------------------------------------------------------------+
*/
(function() {
    var audioctx;
    if (! audioctx) { // singleton
       var audioContext = window.webkitAudioContext || window.AudioContext
       audioctx = new audioContext();
    }
    var WAFrag = function() {
        this.loaded = false;
        this.player = null;
    }
    WAFrag.prototype = {
        loadSMF: function(url, progress) { // from URL
            this.player = new WAPlayer(audioctx);
            var xhr = new XMLHttpRequest();
            var that = this;
            xhr.onreadystatechange = function() {
                if (xhr.readyState < 4) {
//                    console.debug("skip");
                } else {
                    if (xhr.status != 200) {
                        console.log("xhr status:"+xhr.status+", "+url);
                        return -1; // Failure;
                    }
                    var len = xhr.response.byteLength;
                    console.log("midi loading DONE:"+len);
                    that.player.loadSMF(xhr.response);
                    that.loaded = true;
                }
            }
            xhr.open('GET', url);
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
        },
        readSMF: function(data) { // from string
            this.player = new WAPlayer(audioctx);
            this.player.loadSMF(data);
            this.loaded = true;
        },
        play: function(smf) {
            console.debug("WAFrag::play");
            if (this.loaded === false) return ; // skip
            this.player.play();
        },
        stop: function(smf) {
            console.debug("WAFrag::stop");
            if (this.loaded === false) return ; // skip
            this.player.stop();
        },
        suspend: function(smf) {
            console.debug("WAFrag::suspend");
            if (this.loaded === false) return ; // skip
            this.player.suspend();
        },
        resume: function(smf) {
            console.debug("WAFrag::resume");
            if (this.loaded === false) return ; // skip
            this.player.resume();
        },
        addNoteListener: function(handler) {
            this.player.addNoteListener(handler);
        },
        addLylicListener: function(callback) {
            this.player.addNoteLylicListener(handler);
        },
    },
    window.WAFrag = WAFrag;
})();
