const EXPORT = ['StarLoader'];

const STAR_API_BASE = 'http://s.hatena.ne.jp/';

function StarLoader(callback) {
    this.callback = callback;
    this.alive = true;
}

StarLoader.ENTRY_PER_REQUEST = 20;
StarLoader.REQUEST_INTERVAL = 20;

extend(StarLoader.prototype, {
    destroy: function SL_destroy() {
        p('StarLoader destroyed');
        this.callback = null;
        this.alive = false;
    },

    loadBookmarkStar: function SL_loadBookmarkStar(data) {
        if (!this.alive) return;
        let bookmarks = data.bookmarks.concat();
        // 最初につけられたブックマークほどスターがついている可能性が
        // 高いので、まずは逆順にする。コメント付きのブックマークのほうが
        // スターがついている可能性が高いので、先頭に持っていく。
        if (!data.isSorted)
            bookmarks.reverse().sort(function (a, b) !!b.comment - !!a.comment);
        let command = 'entries.simple.json?' +
            't1=' + encodeURIComponent(B_HTTP) + '&' +
            't2=' + '%23bookmark-' + data.eid + '&' +
            bookmarks.slice(0, StarLoader.ENTRY_PER_REQUEST).map(function (b) {
                return 'u=' + b.user + '%2F' + b.timestamp.substring(0, 4) +
                    b.timestamp.substring(5, 7) + b.timestamp.substring(8, 10);
            }).join('&');
        if (data.url)
            command += '&uri=' + encodeURIComponent(data.url);
        this._request('GET', command);
        bookmarks = bookmarks.slice(StarLoader.ENTRY_PER_REQUEST);
        if (bookmarks.length) {
            setTimeout(method(this, 'loadBookmarkStar'),
                       StarLoader.REQUEST_INTERVAL,
                       { eid: data.eid, bookmarks: bookmarks, isSorted: true });
        }
    },

    _request: function SL__request(method, command) {
        let url = STAR_API_BASE + command;
        let xhr = new XMLHttpRequest();
        xhr.mozBackgroundRequest = true;
        xhr.open(method, url);
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
