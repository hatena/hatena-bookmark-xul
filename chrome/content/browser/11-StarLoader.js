const EXPORT = ['StarLoader'];

const STAR_API_BASE = 'http://s.hatena.ne.jp/';
const COMMAND_ENTRIES = 'entries.simple.json';
const COMMAND_ENTRY = 'entry.json';

function StarLoader(callback) {
    this.callback = callback;
    this.alive = true;
}

StarLoader.ENTRIES_PER_REQUEST = 100;
// 初回リクエストは応答性を高めるためにエントリ数を少なめに。
StarLoader.FIRST_ENTRIES_PER_REQUEST = 20;
StarLoader.REQUEST_INTERVAL = 100;
StarLoader.REQUEST_TIMEOUT = 15 * 1000;
StarLoader.DEFAULT_RETRY_COUNT = 3;

extend(StarLoader.prototype, {
    destroy: function SL_destroy() {
        p('StarLoader destroyed');
        this.callback = null;
        this.alive = false;
    },

    loadBookmarkStar: function SL_loadBookmarkStar(data,
                                                   loadCommentedBookmarkStars,
                                                   loadPageStars,
                                                   callback) {
        if (!this.alive) return;
        // 最初につけられたブックマークほどスターがついている可能性が
        // 高いので、まずは逆順にする。コメント付きのブックマークのほうが
        // スターがついている可能性が高いので、先頭に持っていく。
        let bookmarks = data.bookmarks.concat().reverse();
        if (loadCommentedBookmarkStars)
            bookmarks = bookmarks.filter(function (b) b.comment);
        else
            bookmarks.sort(function (a, b) !!b.comment - !!a.comment);
        this._doLoadStars({
            page:      loadPageStars ? data.url : null,
            eid:       data.eid,
            bookmarks: bookmarks,
        }, callback, StarLoader.DEFAULT_RETRY_COUNT);
    },

    _doLoadStars: function SL__doLoadStars(data, callback, retryCount) {
        if (!this.alive) return;
        let limit = StarLoader.ENTRIES_PER_REQUEST;
        let query = 't1=' + encodeURIComponent(B_HTTP) + '&' +
                    't2=' + '%23bookmark-' + data.eid + '&';
        if (data.page) {
            limit = StarLoader.FIRST_ENTRIES_PER_REQUEST;
            query += 'uri=' + encodeURIComponent(data.page) + '&';
        }
        query += data.bookmarks.slice(0, limit).map(function (b) {
            return 'u=' + b.user + '%2F' +
                   b.timestamp.substring(0, 4) +
                   b.timestamp.substring(5, 7) +
                   b.timestamp.substring(8, 10);
        }).join('&');
        this._request('POST', COMMAND_ENTRIES, query, bind(onLoadStars, this));

        function onLoadStars(res) {
            if (res) {
                this._invokeCallback(res.entries, callback, data.page);
                data.page = null;
            } else if (retryCount > 1) {
                this._doLoadStars(data, callback, retryCount - 1);
                return;
            }
            data.bookmarks = data.bookmarks.slice(limit);
            if (data.bookmarks.length)
                this._doLoadStars(data, callback, StarLoader.DEFAULT_RETRY_COUNT);
        }
    },

    _invokeCallback: function SL__invokeCallback(entries, callback, pageURL) {
        if (!this.alive) return;
        let hasPageStars = false;
        entries.forEach(function (entry) {
            if (entry.uri === pageURL)
                hasPageStars = true;
            try {
                callback(entry);
            } catch (ex) {
                Cu.reportError(ex);
            }
        });
        // スターの読み込みが (少なくとも一度は) 完了したことを
        // 知らせるため、対象ページには必ずコールバックを呼び出す。
        if (pageURL && !hasPageStars)
            callback({ uri: pageURL });
    },

    loadAllStars: function SL_loadAllStars(url, callback, retryCount) {
        if (!this.alive) return;
        if (arguments.length < 3)
            retryCount = StarLoader.DEFAULT_RETRY_COUNT;
        let query = 'uri=' + encodeURIComponent(url);
        this._request('GET', COMMAND_ENTRY, query, bind(onLoadStars, this));

        function onLoadStars(res) {
            if (res)
                this._invokeCallback(res.entries, callback);
            else if (!res && retryCount > 1)
                this.loadAllStars(url, callback, retryCount - 1);
        }
    },

    _request: function SL__request(method, command, query, callback) {
        method = method.toUpperCase();
        let url = STAR_API_BASE + command;
        if (method === 'GET')
            url += '?' + query;
        let xhr = new XMLHttpRequest();
        xhr.mozBackgroundRequest = true;
        xhr.open(method, url);
        xhr.addEventListener('load', onLoad, false);
        xhr.addEventListener('error', onError, false);
        xhr.addEventListener('progress', onProgress, false);
        if (User.user)
            xhr.setRequestHeader('Cookie', 'rk=' + encodeURIComponent(User.user.rk));
        let postData = null;
        if (method === 'POST') {
            postData = query;
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        xhr.send(postData);
        let timeout = StarLoader.REQUEST_TIMEOUT;
        let timer = new BuiltInTimer({ observe: onTimeout }, timeout,
                                     Ci.nsITimer.TYPE_ONE_SHOT);
        let self = this;

        function onLoad() {
            p('StarLoader: load ' + url + '\n' + query + '\n\n' + xhr.responseText);
            removeListeners();
            let res = decodeJSON(xhr.responseText);
            if (res && res.rks) StarAdder.rks = res.rks;
            callback(res);
        }
        function onError() {
            p('StarLoader: Fail to load ' + url);
            removeListeners();
            callback(null);
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
            timer = null;
        }
    },
});
