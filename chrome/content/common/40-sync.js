
// Sync to remote bookmark

const EXPORT = ["Sync"];

var Sync = {};
EventService.implement(Sync);

extend(Sync, {
    init: function Sync_init () {
        let db = model('Bookmark').db;
        if (!db.tableExists('bookmarks')) {
            hBookmark.Model.resetAll();
        }
        this.sync();
    },
    createDataStructure: function Sync_createDataStructure (text) {
        let infos = text.split("\n");
        let bookmarks = infos.splice(0, infos.length * 3/4);
        return [bookmarks, infos];
    },
    sync: function Sync_sync () {
        if (this._syncing) return;

        let url = User.user.dataURL;
        let b = model('Bookmark').findFirst({order: 'date desc'});

        this.dispatch('start');
        if (b && b.date) {
            net.get(url, method(this, 'fetchCallback'), method(this, 'errorback'), true, {
                timestamp: b.date
            });
        } else {
            net.get(url, method(this, 'fetchCallback'), method(this, 'errorback'), true);
        }
    },
    errorback: function Sync_errorAll () {
        this.dispatch('fail');
    },
    get db() {
        return User.user.database;
    },
    fetchCallback: function Sync_allCallback (req)  {
        this.dispatch('progress', {value: 0});
        if (!User.user) {
            // XXX: データロード後にユーザが無い
            this.errorback();
            return;
        }

        let BOOKMARK  = model('Bookmark');

        let text = req.responseText;
        let [bookmarks, infos] = this.createDataStructure(text);
        p(sprintf('start: %d data', infos.length));
        let now = Date.now();
        p('start');
        this.db.beginTransaction();
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
                this.dispatch('progress', { value: i/len*100|0 });
                this.db.commitTransaction();
                async.wait(1000);
                this.db.beginTransaction();
                p('wait: ' + (Date.now() - now));
            }
        }
        BOOKMARK.db.commitTransaction();
        this.dispatch('complete');

        p(infos.length);
        p('time: ' + (Date.now() - now));
    }
});

EventService.createListener('UserChange', function() {
    if (User.user)
        Sync.init();
}, User);

// EventService.createListener('firstPreload', function() {
//     if (User.user) {
//         async.wait(10); // XXX: waiting...
//         Sync.init();
//     }
// }, window);

