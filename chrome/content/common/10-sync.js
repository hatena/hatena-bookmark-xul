// リモートのブックマークと同期をとる

const EXPORT = ["Sync"];

var Sync = {};
EventService.implement(Sync);

extend(Sync, {
    createDataStructure: function Sync_createDataStructure (text) {
        let infos = text.split("\n");
        let bookmarks = infos.splice(0, infos.length * 3/4);
        return [bookmarks, infos];
    },
    fetchAll: function Sync_fetchAll () {
    },
    all: function Sync_all (url) {
        if (this._syncing) return;
        this.dispatch('start');
        net.get(url, method(this, 'allCallback'), method(this, 'allError'), true);
    },
    allError : function Sync_errorAll () {
        this.dispatch('fail');
    },
    allCallback: function Sync_allCallback (req)  {
        this.dispatch('progress', {value: 0});
        let BOOKMARK  = model('Bookmark');
        let box = document.getElementById('hBookmark-syncProgressBox');
        box.removeAttribute('hidden');
        let meter = document.getElementById('hBookmark-syncProgressMeter');
        meter.value = 0;

        // XXX 初期化処理
        hBookmark.Model.resetAll();

        BOOKMARK.db.beginTransaction();
        let text = req.responseText;
        let [bookmarks, infos] = this.createDataStructure(text);
        p(sprintf('start: %d data', infos.length));
        let now = Date.now();
        p('start');
        BOOKMARK.db.beginTransaction();
        for (let i = 0, len = infos.length;  i < len; i++) {
            let bi = i * 3;
            let timestamp = infos[i].split("\t", 2)[1];
            let title = bookmarks[bi];
            let comment = bookmarks[bi+1];
            let url = bookmarks[bi+2];
            let b = new BOOKMARK;
            b.title = title;
            b.comment = comment;
            b.url = url;
            b.search = [title, comment, url].join("\0");
            b.date = parseInt(timestamp);
            if (url) {
                try {
                    b.save();
                } catch(e) {
                    p('error: ' + [url, title, comment, timestamp].toString());
                }
            } else {
            }
            if (i % 100 == 0) {
                meter.value = i/len*100|0;
                this.dispatch('progress', { value: i/len*100|0 });
                BOOKMARK.db.commitTransaction();
                async.wait(1000);
                BOOKMARK.db.beginTransaction();
                p('wait: ' + (Date.now() - now));
            }
        }
        BOOKMARK.db.commitTransaction();
        this.dispatch('complete');
        box.setAttribute('hidden', true);

        p(infos.length);
        p('time: ' + (Date.now() - now));
    }
});


EventService.createListener('firstPreload', function() {
    if (User.user) {
        Sync.all(User.user.dataURL);
    }
});

