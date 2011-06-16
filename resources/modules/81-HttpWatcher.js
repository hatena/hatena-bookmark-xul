Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ["HttpWatcher"];

var HttpWatcher = {
    // 監視するホスト
    targetHostsArray: [
        B_HOST,
        //"bbeta.hatena.ne.jp",
        //"localhost",
    ],

    get targetHosts() {
        let hosts = this.targetHostsArray.reduce(function (hosts, host) {
            hosts[host] = true;
            return hosts;
        }, new DictionaryObject());
        delete this.targetHosts;
        return this.targetHosts = hosts;
    },

    onEditBookmark: function HW_onEditBookmark(channel) {
        let url = this._getResponseHeader(channel, "X-Bookmark-URL");
        if (!url) return;
        let data = this._getPostData(channel);
        if (!data) return;

        // ブックマーク成功したら、sync する
        // これにより、リモートとのデータの同期がとれる
        // XXX: Sync に依存してしまう
        let maxTryCount = 3;
        let triedCount = 0;
        function trySync() {
            triedCount++;
            let listener = Sync.createListener("complete", function onSync() {
                p('Sync completed');
                listener.unlisten();
                HTTPCache.entry.cache.clear(data.url);
                if (User.user && !User.user.hasBookmark(data.url) &&
                    triedCount < maxTryCount) {
                    p(data.url + ' is not registered.  Retry sync.');
                    // 同期が間に合わなかったら少し待ってもう一度同期する。
                    new BuiltInTimer({ observe: trySync },
                                     triedCount * 2000,
                                     Ci.nsITimer.TYPE_ONE_SHOT);
                }
            }, null, 0, false);
            Sync.sync();
        }
        trySync();

        let bookmark = Model.Bookmark.findByUrl(data.url)[0];
        if (bookmark) {
            // すでに存在するブックマークは Sync で
            // 同期できないので、ここで DB を更新しておく。
            if (data.title)
                bookmark.title = data.title;
            bookmark.comment = data.comment;
            bookmark.save();
            EventService.dispatch('BookmarksUpdated');
        }
    },

    onDeleteBookmarks: function HW_onDeleteBookmarks(channel) {
        if (channel.responseStatus !== 200) return;
        let data = this._getPostData(channel);
        let url = this._getResponseHeader(channel, "X-Bookmark-URL") || data.url;
        let urls = url ? [url] : data.urllist ? data.urllist.split("|") : null;
        if (!urls) return;
        Model.Bookmark.deleteByURLs(urls);
    },

    onEditTag: function HW_onEditTag(channel) {
        switch (channel.responseStatus) {
        case 200:
            // JSON API の成功
            break;

        // タグ編集ページ (/user_id/tag?tag=...) から編集した場合、
        // レスポンスはタグページまたはホームページへのリダイレクトになる。
        case 302:
            let location = this._getResponseHeader(channel, "Location");
            if (!location) return;
            // RFC 2616 では Location ヘッダの値は絶対 URI となっているが、
            // はてなブックマークでは絶対パスの相対 URI になっている。
            // どちらでも大丈夫なようにいったん URI を解決する。
            let path = newURI(location, null, channel.URI).path;
            // 再度タグ入力を求められる
            // (/user_id/tag?tag=... へ飛ばされる) なら失敗とみなす。
            if (/^\/[\w-]+\/tag\?/.test(path)) return;
            break;

        default:
            return;
        }
        let data = this._getPostData(channel);
        if (data.newtag)
            Model.Tag.rename(data.tag, data.newtag);
        else
            Model.Tag.deleteByName(data.tag);
    },

    _getResponseHeader: function HW__getResponseHeader(channel, header) {
        try {
            return channel.getResponseHeader(header);
        } catch (ex) {
            return null;
        }
    },

    _getPostData: function HW__getPostData(channel) {
        let rawStream = channel.uploadStream;
        if (!(rawStream instanceof Ci.nsISeekableStream)) return null;
        rawStream.seek(Ci.nsISeekableStream.NS_SEEK_SET, 0);
        let stream = Cc["@mozilla.org/scriptableinputstream;1"].
                     createInstance(Ci.nsIScriptableInputStream);
        stream.init(rawStream);
        let body = stream.read(stream.available());
        if (rawStream instanceof Ci.nsIMIMEInputStream)
            body = body.replace(/^(?:.+\r\n)+\r\n/, "");
        return this._toMap(body);
    },

    _toMap: function HW__toMap(string) {
        let result = {};
        string.replace(/\+/g, "%20").split("&").forEach(function (pair) {
            let [key, value] = pair.split("=");
            try {
                value = decodeURIComponent(value);
            } catch (ex) {}
            result[key] = value;
        });
        return result;
    },

    EDIT_BOOKMARK_PATTERN:    /^\/(?:bookmarklet\.edit|[\w-]+\/add\.edit)\b/,
    DELETE_BOOKMARKS_PATTERN: /^\/[\w-]+\/api\.delete_bookmark\b/,
    EDIT_TAG_PATTERN:         /^\/[\w-]+\/tag\.(?:edit|delete)\b/,

    observe: function HW_observe(subject, topic, data) {
        if (!(subject instanceof Ci.nsIHttpChannel) ||
            !(subject instanceof Ci.nsIUploadChannel) ||
            !(subject.URI.host in this.targetHosts))
            return;
        let path = subject.URI.path;
        if (this.EDIT_BOOKMARK_PATTERN.test(path)) {
            this.onEditBookmark(subject);
        } else if (this.DELETE_BOOKMARKS_PATTERN.test(path)) {
            this.onDeleteBookmarks(subject);
        } else if (this.EDIT_TAG_PATTERN.test(path)) {
            this.onEditTag(subject);
        } else if ((path || '').indexOf('/guide/firefox_start_3') == 0) {
            Prefs.bookmark.set('everLoggedIn', true);
            Prefs.bookmark.set('everBookmarked', true);
        }
    },

    startObserving: function HW_startObserving() {
        ObserverService.addObserver(this, "http-on-examine-response", false);
        ObserverService.addObserver(this.quitObserver, "quit-application", false);
    },

    stopObserving: function HW_stopObserving() {
        p('stop HttpWatcher observing');
        ObserverService.removeObserver(this, "http-on-examine-response");
        ObserverService.removeObserver(this.quitObserver, "quit-application");
    },

    quitObserver: {
        observe: function HW_QO_observe(subject, topic, data) {
            HttpWatcher.stopObserving();
        }
    }
};

HttpWatcher.startObserving();
