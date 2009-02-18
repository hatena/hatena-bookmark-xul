const EXPORT = ["Model"];
var hBookmark = this;

(function() {
    var Model = {};
    hBookmark.Model = Model;

    extend(Model, {
        MODELS: ['Bookmark', 'Tag'],
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
        },
        resetAll: function() {
            this.deleteAll();
            this.createAll();
        },
        deleteAll: function() {
            this.MODELS.forEach(function(m) {
            try { 
                Model[m].deinitialize() 
            } catch(e) {
                p('delete error:' + e);
            }}
            );
        },
        createAll: function() {
            var models = this.MODELS.forEach(function(m) Model[m].initialize());
        },
    });

    Model.Entity = function (def) {
        let model = extend(Entity(def), {
            get db() Model.db,
        });
        return model;
    };

    Model.Bookmark = Model.Entity({
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

    extend(Model.Bookmark, {
        parseTags: function(str) {
            /*
             * XXX: [hoge][huga] foo [baz] の baz もまっちしてしまう
             */
            let regex = new RegExp('\\[([^\:\\[\\]]+)\\]', 'g');
            let match;
            let tags = [];
            while (( match = regex.exec(str) )) {
                tags.push(match[1]);
            }
            return tags;
        },
        findByTags: function(tags) {
            tags = [].concat(tags);
            let bids = [];
            let res = [];
            for (var i = 0;  i < tags.length; i++) {
                var tag = tags[i];
                if (i == 0) {
                    res = Model.Tag.findByName(tag);
                } else {
                    res = Model.Tag.find({
                        where: 'name = :name AND bookmark_id IN (' + bids.join(',') + ')',
                        name: tag,
                    });
                }
                if (!res.length) return [];
                bids = res.map(function(t) t.bookmark_id);
            }
            res = Model.Bookmark.find({
                where: 'id IN (' + bids.join(',') + ')'
            });
            return res;
        },
    });

    extend(Model.Bookmark.prototype, {
        get tags(comment) {
            return Model.Bookmark.parseTags(this.comment);
        },
        updateTags: function() {
            let tags = this.tags;
            if (this.id > 0) {
                Model.Tag.db.execute('delete from tags where bookmark_id = ' + this.id);
                //Model.Tag.delete({
                //    bookmark_id: this.id
                //});
            }
            for (var i = 0;  i < tags.length; i++) {
                var tag = tags[i];
                var t = new Model.Tag;
                t.bookmark_id = this.id;
                t.name = tag;
                t.save();
            }
        }
    });

    addAround(Model.Bookmark, 'initialize', function(proceed, args, target) {
        proceed(args);
        target.db.connection.executeSimpleSQL('CREATE INDEX "bookmarks_date" ON "bookmarks" ("date" DESC)');
        target.db.connection.executeSimpleSQL('CREATE INDEX "bookmarks_date_asc" ON "bookmarks" ("date" ASC)');
    });

    addAround(Model.Bookmark.prototype, 'save', function(proceed, args, target) {
        target.search = [target.title, target.comment, target.url].join("\0"); // SQLite での検索用
        proceed(args);
        target.updateTags();
    });

    Model.Tag = Model.Entity({
        name : 'tags',
        fields : {
            id           : 'INTEGER PRIMARY KEY',
            bookmark_id  : 'INTEGER NOT NULL',
            name         : 'TEXT',
        }
    });

    extend(Model.Tag, {
        findDistinctTags: function () this.find({ group: "name" }),

        findRelatedTags: function (tagNames) {
            if (!tagNames || !tagNames.length)
                return this.findDistinctTags();
            var bmIds = null;
            for (var i = 0; i < tagNames.length; i++) {
                var cond = { where: "name = :name", name: tagNames[i] };
                if (bmIds) {
                    cond.where +=
                    " AND bookmark_id IN (" + bmIds.join(",") + ")";
                }
                bmIds = this.find(cond).map(function (tag) tag.bookmark_id);
                if (!bmIds.length) return bmIds;
            }
            var condition = { group: "name" };
            var where = "name NOT IN (" + tagNames.map(function (name, i) {
                var paramName = "name" + i;
                condition[paramName] = name;
                return ":" + paramName;
            }).join(",") + ") AND bookmark_id IN (" + bmIds.join(",") + ")";
            condition.where = where;
            return this.find(condition);
        }
    });

})();


