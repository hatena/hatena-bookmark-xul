
(function() {
    var Model = {};
    hBookmark.Model = Model;

    extend(Model, {
        init: function() {
            if (this._init) return;
            this._init = true;
        },
        get db() {
            if (!this._init) this.init();
            if (this._db) return this._db;

            var db = new Database('hatena.bookmark.sqlite');
            return this.db = db;
        },
        set db(db) {
            this._db = db;
            return db;
        }
    });

    Model.Bookmark = Entity({
        name : 'bookmarks',
        fields : {
            id           : 'INTEGER PRIMARY KEY',
            place_id     : 'INTEGER',
            url          : 'TEXT UNIQUE NOT NULL',
            title        : 'TEXT',
            search       : 'TEXT',
            date         : 'TIMESTAMP NOT NULL',
            last_visited : 'TIMESTAMP',
            comment      : 'TEXT',
        }
    });
    Model.Bookmark.__defineGetter__('db', function() Model.db );
})();


