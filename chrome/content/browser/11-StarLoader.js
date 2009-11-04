const EXPORT = ['StarLoader'];

const STAR_API_BASE = 'http://s.hatena.ne.jp/';

function StarLoader(callback) {
    this.callback = callback;
    this.pendingURLs = [];
    this._timerId = 0;
    this.alive = true;
}

StarLoader.ENTRY_PER_REQUEST = 20;
StarLoader.REQUEST_INTERVAL = 20;

extend(StarLoader.prototype, {
    destroy: function SL_destroy() {
        p('StarLoader destroyed');
        clearInterval(this._timerId);
        this.callback = null;
        this.pendingURLs = null;
        this.alive = false;
    },

    load: function SL_load(rankedURLs) {
        if (typeof rankedURLs === 'string')
            rankedURLs = [[rankedURLs]];
        else if (rankedURLs.length && typeof rankedURLs[0] === 'string')
            rankedURLs = [rankedURLs];
        let n = StarLoader.ENTRY_PER_REQUEST;
        rankedURLs.forEach(function (urls) {
            for (let i = 0; i < urls.length; i += n)
                this.pendingURLs.push(urls.slice(i, i + n));
        }, this);
        if (this.pendingURLs.length && !this._timerId)
            this._schedule();
    },

    _schedule: function SL__schedule() {
        this._loadStarFor(this.pendingURLs.shift());
        if (this.pendingURLs.length) {
            if (!this._timerId)
                this._timerId = setInterval(method(this, '_schedule'),
                                            StarLoader.REQUEST_INTERVAL);
        } else {
            clearInterval(this._timerId);
            this._timerId = 0;
        }
    },

    _loadStarFor: function SL__loadStarFor(urls) {
        if (!urls || !urls.length) return;
        let command = 'entries.json?' + urls.map(function (url) {
            return 'uri=' + encodeURIComponent(url);
        }).join('&');
        this._request('GET', command);
    },

    _request: function SL__request(method, command) {
        let url = STAR_API_BASE + command;
        let xhr = new XMLHttpRequest();
        xhr.mozBackgroundRequest = true;
        xhr.open('GET', url);
        xhr.addEventListener('load', onLoad, false);
        xhr.addEventListener('error', onError, false);
        xhr.addEventListener('progress', onProgress, false);
        xhr.send(null);
        let timeout = 60 * 1000;
        let timer = new BuiltInTimer({ observe: onTimeout }, timeout,
                                     Ci.nsITimer.TYPE_ONE_SHOT);
        let self = this;

        function onLoad() {
            p('StarLoader: load ' + url + '\n' + xhr.responseText);
            removeListeners();
            let data = decodeJSON(xhr.responseText);
            if (!data) {
                onError();
                return;
            }
            self._callCallback(data);
        }
        function onError() {
            removeListeners();
            p('StarLoader: Fail to load ' + url);
        }
        function onProgress() {
            timer.cancel();
            timer.init({ observe: onTimeout }, timeout, Ci.nsITimer.TYPE_ONE_SHOT);
        }
        function onTimeout() {
            xhr.abort();
            onError();
        }
        function removeListeners() {
            xhr.removeEventListener('load', onLoad, false);
            xhr.removeEventListener('error', onError, false);
            xhr.removeEventListener('progress', onProgress, false);
            timer.cancel();
        }
    },

    _callCallback: function SL__callCallback(data) {
        if (!this.alive) return;
        data.entries.forEach(function (entry) {
            try {
                this.callback(entry);
            } catch (ex) {
                Cu.reportError(ex);
            }
        }, this);
    },
});
