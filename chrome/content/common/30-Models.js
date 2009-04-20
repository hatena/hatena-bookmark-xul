const EXPORT = ["Model"];

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
        this.db.version = 1;
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
                db.rollbackTransaction();
                p('migration error!');
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
            return User.user ? User.user.database : Model.db;
        }
    });
    return model;
};


