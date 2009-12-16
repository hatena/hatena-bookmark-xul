
let Command = Star.Command;

function Loader() {
    this.alive = true;
}

extend(Loader, {
    ENTRIES_PER_REQUEST: 100,
    // 初回リクエストは応答性を高めるためにエントリ数を少なめに。
    FIRST_ENTRIES_PER_REQUEST: 20,
});

extend(Loader.prototype, {
    destroy: function SL_destroy() {
        p('Star.Loader destroyed');
        this.alive = false;
    },

    loadBookmarkStar: function SL_loadBookmarkStar(data,
                                                   onlyCommentedBookmarkStars,
                                                   withPageStars,
                                                   callback) {
        if (!this.alive) return;
        // 最初につけられたブックマークほどスターがついている可能性が
        // 高いので、まずは逆順にする。コメント付きのブックマークのほうが
        // スターがついている可能性が高いので、先頭に持っていく。
        let bookmarks = data.bookmarks.concat().reverse();
        if (onlyCommentedBookmarkStars)
            bookmarks = bookmarks.filter(function (b) b.comment);
        else
            bookmarks.sort(function (a, b) !!b.comment - !!a.comment);
        this._doLoadBookmarkStars({
            page:      withPageStars ? data.url : null,
            eid:       data.eid,
            bookmarks: bookmarks,
            callback:  callback,
        });
    },

    _doLoadBookmarkStars: function SL__doLoadBookmarkStars(data) {
        if (!this.alive) return;
        let limit = data.page ? Loader.FIRST_ENTRIES_PER_REQUEST
                              : Loader.ENTRIES_PER_REQUEST;
        let query = {
            t1: B_HTTP,
            t2: '#bookmark-' + data.eid,
            u: data.bookmarks.slice(0, limit).map(function (b) {
                return b.user + '/' +
                       b.timestamp.substring(0, 4) +
                       b.timestamp.substring(5, 7) +
                       b.timestamp.substring(8, 10);
            }),
        };
        if (data.page)
            query.uri = data.page;
        new Command(Command.LOAD_STARS, query, bind(onLoadStars, this));

        function onLoadStars(res) {
            if (res) {
                this._invokeCallback(res.entries, data.callback, data.page);
                data.page = null;
            }
            data.bookmarks = data.bookmarks.slice(limit);
            if (data.bookmarks.length)
                this._doLoadBookmarkStars(data);
        }
    },

    loadAllStars: function SL_loadAllStars(uri, callback) {
        if (!this.alive) return;
        let query = { uri: uri };
        new Command(Command.LOAD_ALL_STARS, query, bind(onLoadStars, this));

        function onLoadStars(res) {
            if (res)
                this._invokeCallback(res.entries, callback);
        }
    },

    _invokeCallback: function SL__invokeCallback(entries, callback, pageURI) {
        if (!this.alive) return;
        let hasPageStars = false;
        entries.forEach(function (entry) {
            let isPageStars = entry.uri === pageURI;
            if (isPageStars)
                hasPageStars = true;
            try {
                callback(entry, isPageStars);
            } catch (ex) {
                Cu.reportError(ex);
            }
        });
        // スターの読み込みが (少なくとも一度は) 完了したことを
        // 知らせるため、対象ページには必ずコールバックを呼び出す。
        if (pageURI && !hasPageStars) {
            callback({ uri: pageURI }, true);
        }
    },
});

Star.Loader = Loader;
