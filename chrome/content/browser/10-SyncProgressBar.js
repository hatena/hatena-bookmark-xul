
var SyncProggressBar = {
    init: function SyncProggressBar_init () {
        if (this._inited) return;

        this._inited = true;

        this.box = document.getElementById('hBookmark-syncProgressBox');
        this.meter = document.getElementById('hBookmark-syncProgressMeter');

        let events = ['start', 'complete', 'fail', 'progress'];
        for (var i = 0;  i < events.length; i++) {
            let eName = events[i];
            Sync.createListener(eName, method(this, eName + 'Handler'));
        }
        //box.removeAttribute('hidden');
        //meter.value = 0;
        //meter.value = i/len*100|0;
        //box.setAttribute('hidden', true);
    },
    startHandler: function(e) {
        this.box.removeAttribute('hidden');
    },
    completeHandler: function(e) {
        this.box.setAttribute('hidden', true);
    },
    failHandler: function(e) {
        this.box.setAttribute('hidden', true);
    },
    progressHandler: function(e) {
        this.meter.value = e.data.value;
    },
};

EventService.createListener('load', function() {
    SyncProggressBar.init();
});

