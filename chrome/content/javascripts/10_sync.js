
hBookmark.Sync = {
    all: function() {
        var url = 'http://b.hatena.ne.jp/maoe/search.data';
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        req.send(null);
        // ASync じゃない
        var BOOKMARK  = model('Bookmark');

        // XXX 初期化処理
        hBookmark.Model.resetAll();

        BOOKMARK.db.beginTransaction();
        if (req.status == 200) {
            var text = req.responseText;
            var [bookmarks, infos] = this.createDataStructure(text);
            var now = Date.now();
            p('start');
            for (var i = 0, len = infos.length;  i < len; i++) {
                var bi = i * 3;
                var timestamp = infos[i].split("\t", 2)[1];
                var title = bookmarks[bi];
                var comment = bookmarks[bi+1];
                var url = bookmarks[bi+2];
                var b = new BOOKMARK;
                b.title = title;
                b.comment = comment;
                b.url = url;
                // b.search = [title, comment, url].join("\0");
                b.date = parseInt(timestamp);
                if (url) {
                    try {
                        b.save();
                    } catch(e) {
                        p('error: ' + [url, title, comment, timestamp].toString());
                    }
                } else {
                }
            }
            BOOKMARK.db.commitTransaction();
            p(infos.length);
            p('time: ' + (Date.now() - now));
        }
    },
    createDataStructure: function(data) {
        var infos = infos = data.split("\n");
        var bookmarks = infos.splice(0, infos.length * 3/4);
        return [bookmarks, infos];
    },
}


