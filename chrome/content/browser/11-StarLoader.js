const EXPORT = ['StarLoader'];

const STAR_API_BASE = 'http://s.hatena.ne.jp/';

function StarLoader(callback) {
    this.callback = callback;
    this.cache = {};
    this.alive = true;
}

StarLoader.ENTRIES_PER_REQUEST = 100;
StarLoader.REQUEST_INTERVAL = 100;

extend(StarLoader.prototype, {
    destroy: function SL_destroy() {
        p('StarLoader destroyed');
        this.callback = null;
        this.cache = null;
        this.alive = false;
    },

    loadBookmarkStar: function SL_loadBookmarkStar(data) {
        if (!this.alive) return;
        let bookmarks = data.bookmarks;
        let cachedEntries = [];
        let postData = 't1=' + encodeURIComponent(B_HTTP) + '&' +
                       't2=' + '%23bookmark-' + data.eid + '&';
        if (!data.deferred) {
            if (data.url in this.cache)
                cachedEntries.push(this.cache[data.url]);
            else
                postData += 'uri=' + encodeURIComponent(data.url) + '&';
            bookmarks = bookmarks.filter(function (bookmark) {
                let key = bookmark.user + data.eid;
                if (key in this.cache) {
                    cachedEntries.push(this.cache[key]);
                    return false;
                }
                return true;
            }, this);
            // 最初につけられたブックマークほどスターがついている可能性が
            // 高いので、まずは逆順にする。コメント付きのブックマークのほうが
            // スターがついている可能性が高いので、先頭に持っていく。
            bookmarks.reverse().sort(function (a, b) !!b.comment - !!a.comment);
        }
        let limit = StarLoader.ENTRIES_PER_REQUEST;
        postData += bookmarks.slice(0, limit).map(function (b) {
            return 'u=' + b.user + '%2F' + b.timestamp.substring(0, 4) +
                b.timestamp.substring(5, 7) + b.timestamp.substring(8, 10);
        }).join('&');
        this._request('POST', 'entries.simple.json', postData);
        setTimeout(method(this, '_invokeCallbackForCache'), 0, cachedEntries);
        if (bookmarks.length > limit) {
            setTimeout(method(this, 'loadBookmarkStar'),
                       StarLoader.REQUEST_INTERVAL,
                       { eid: data.eid, bookmarks: bookmarks.slice(limit), deferred: true });
        }
    },

    loadAllStars: function SL_loadAllStars(url) {
        if (!this.alive) return;
        if (url in this.cache) {
            setTimeout(method(this, '_invokeCallbackForCache'), 0,
                       [this.cache[url]]);
            return;
        }
        let command = 'entry.json?uri=' + encodeURIComponent(url);
        this._request('GET', command);
    },

    _request: function SL__request(method, command, postData) {
        let url = STAR_API_BASE + command;
        let xhr = new XMLHttpRequest();
        xhr.mozBackgroundRequest = true;
        xhr.open(method, url);
        xhr.addEventListener('load', onLoad, false);
        xhr.addEventListener('error', onError, false);
        xhr.addEventListener('progress', onProgress, false);
        if (method.toUpperCase() === 'POST')
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(postData || null);
        let timeout = 60 * 1000;
        let timer = new BuiltInTimer({ observe: onTimeout }, timeout,
                                     Ci.nsITimer.TYPE_ONE_SHOT);
        let self = this;

        function onLoad() {
            p('StarLoader: load ' + url + '\n' + postData + '\n\n' + xhr.responseText);
            removeListeners();
            let data = decodeJSON(xhr.responseText);
            if (!data) {
                onError();
                return;
            }
            self._invokeCallback(data, command);
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

    _invokeCallbackForCache: function SL__invokeCallbackForCache(entries) {
        if (!this.alive) return;
        let limit = StarLoader.ENTRIES_PER_REQUEST;
        entries.slice(0, limit).forEach(function (entry) {
            try {
                this.callback(entry);
            } catch (ex) {
                Cu.reportError(ex);
            }
        }, this);
        if (entries.length > limit)
            setTimeout(method(this, '_invokeCallbackForCache'),
                       StarLoader.REQUEST_INTERVAL / 2,
                       entries.slice(limit));
    },

    _invokeCallback: function SL__invokeCallback(data, command) {
        if (!this.alive) return;
        let keyRE = command.indexOf('entries.simple.json') === 0
            ? new RegExp('^' + B_HTTP.replace(/\W/g, '\\$&') +
                         '([\\w-]+)/\\d{8}#bookmark-(\\d+)$')
            : null;
        data.entries.forEach(function (entry) {
            let key = entry.uri;
            let match = keyRE && keyRE.exec(key);
            if (match)
                key = match[1] + match[2];
            this.cache[key] = entry;
            try {
                this.callback(entry);
            } catch (ex) {
                Cu.reportError(ex);
            }
        }, this);
    },
});
