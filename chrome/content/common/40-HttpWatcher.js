const EXPORT = ["HttpWatcher"];

var HttpWatcher = shared.get("HttpWatcher") || {
    // 監視するホスト
    targetHostsArray: [
        "b.hatena.ne.jp",
        //"bbeta.hatena.ne.jp",
        //"localhost",
    ],

    get targetHosts HW_get_targetHosts() {
        let hosts = this.targetHostsArray.reduce(function (hosts, host) {
            hosts[host] = true;
            return hosts;
        }, new DictionaryObject());
        delete this.targetHosts;
        return this.targetHosts = hosts;
    },

    onBookmarkEdit: function HW_onBookmarkEdit(channel) {
        let url = this._getBookmakedURL(channel);
        if (!url) return;
        let data = this._getPostData(channel);
        if (!data) return;
        this.syncBookmark(data);
    },

    _getBookmakedURL: function HW__getBookmarkedURL(channel) {
        try {
            return channel.getResponseHeader("X-Bookmark-URL");
        } catch (ex) {
            return null;
        }
    },

    syncBookmark: function HW_syncBookmark(data) {
        // ブックマーク成功したら、sync する
        // これにより、リモートとのデータの同期がとれる
        // XXX: Sync に依存してしまう
        let listener = Sync.createListener("complete", function onSync() {
            p('Sync completed');
            listener.unlisten();
            HTTPCache.entry.cache.clear(data.url);
            if (!Model.Bookmark.findByUrl(data.url).length) {
                p(data.url + ' is not registered.  Retry sync.');
                // 同期が間に合わなかったら少し待ってもう一度だけ同期する。
                setTimeout(method(Sync, 'sync'), 2000);
            }
        }, null, 0, false);
        Sync.sync();

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

    EDIT_PATTERN: /^\/(?:bookmarklet\.edit|[\w-]+\/add\.edit)\b/,

    observe: function HW_observe(subject, topic, data) {
        if (!(subject instanceof Ci.nsIHttpChannel) ||
            !(subject instanceof Ci.nsIUploadChannel) ||
            !(subject.URI.host in this.targetHosts))
            return;
        let path = subject.URI.path;
        if (this.EDIT_PATTERN.test(path)) {
            this.onBookmarkEdit(subject);
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

if (!shared.has("HttpWatcher")) {
    HttpWatcher.startObserving();
    shared.set("HttpWatcher", HttpWatcher);
}
