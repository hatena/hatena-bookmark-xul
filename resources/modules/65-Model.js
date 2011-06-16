Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ["Model", "model"];

var Model = {};

extend(Model, {
    MODELS: [],
    init: function() {
        if (this._init) return;
        this._init = true;
    },
    get db() {
        if (!this._init) this.init();
        if (this._db) return this._db;

        // var db = new Database('hatena.bookmark.sqlite');
        // return this.db = db;
    },
    set db(db) {
        this._db = db;
        return db;
    },
    resetAll: function() {
        this.deleteAll();
        this.createAll();
        var db = this.getSafeDB();
        if (db)
            db.version = 1;
    },
    deleteAll: function() {
        this.MODELS.forEach(function(m) {
            try { 
                Model[m].deinitialize() 
            } catch(e) {
                log.error(e);
            }
        });
    },
    createAll: function() {
        var models = this.MODELS.forEach(function(m) Model[m].initialize());
    },
    getSafeDB: function() {
        let b = model('Bookmark');
        if (b) {
            return b.db;
        } else {
            return null;
        }
    },
    migrate: function() {
        let db = this.getSafeDB();
        if (!db) {
            p('migrate fail.DB not found');
            return;
        }
        this.db = db;
        let version = db.version || 0;
        if (version == 0) {
            // tag の nocase のための migration
            p('DB migrate: ' + version);
            p.b(function() {
            try {
                // もし何らかの例外が起きたときには、rollback する
                // sqlite3 は alter table のトランザクションが可能らしい
                db.beginTransaction();
                db.execute('alter table tags rename to temptags');
                Model.Tag.initialize();
                db.execute('insert into tags select id, bookmark_id, name from temptags');
                db.execute('drop table temptags');
                db.commitTransaction();
            } catch(e) {
                p('migration error!');
                db.rollbackTransaction();
            } finally {
                //
            }
            }, 'tag migration');
            this.db.version = 1;
            // this.resetAll();
        }
    },
});

Model.Entity = function (def) {
    let model = extend(Entity(def), {
        get db() {
            var user = shared.get('User').user;
            return user ? user.database : Model.db;
        }
    });
    return model;
};

var model = function(name) {
    var m = Model[name];
    if (!m) { throw 'model not found' };
    return m;
};
