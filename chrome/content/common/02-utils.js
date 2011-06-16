
/*
 * utils 内部では、
 * 頭に _ のついてないローカル変数はすべて EXPORT の対象となる
 */

// Timer

var Timer = function(interval, repeatCount) {
    EventService.implement(this);
    this.currentCount = 0;
    this.interval = interval || 60; // ms
    this.repeatCount = repeatCount || 0;
}

Timer.prototype = {
    start: function() {
        this._running = true;
        this.loopTimer = setTimeout(function(self) {
            self.loop();
        }, this.interval, this);
    },
    reset: function() {
        this.stop();
        this.currentCount = 0;
    },
    stop: function() {
        this.clearTimer();
        this._running = false;
    },
    clearTimer: function() {
        if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            delete this.loopTimer;
        }
    },
    get running() this._running,
    loop: function() {
        if (!this.running) return;
        this.currentCount++;
        if (this.repeatCount && this.currentCount >= this.repeatCount) {
            this.stop();
            this.dispatch('timer');
            this.dispatch('timerComplete');
            return;
        }
        this.dispatch('timer');
        this.loopTimer = setTimeout(function(self) {
            self.loop();
        }, this.interval, this);
    },
}


var EXPORT = [m for (m in new Iterator(this, true))
                          if (m[0] !== "_" && m !== "EXPORT")];


