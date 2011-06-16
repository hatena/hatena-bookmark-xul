Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = [];

let Bookmark = Model.Entity({
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

let createWhereLike = function (word, fieldName) {
    // sqlite での検索は case_sensitive_like = 1 で行った方が速いため
    if (!fieldName) fieldName = 'search';
    var words = word.toLowerCase().split(/\s+/);
    var sql = [];
    var args = {};
    var c = 0;
    var likeGenerateor = function(word) {
        var word = '%' + word.replace(/[_%#]/g, '#$&') + '%';
        var c1 = 'arg' + c++;
        var arg = {};
        arg[c1] = word;
        // escape 演算子を使うと遅くなるらしいので、必要なときのみ使う。
        return [fieldName + ' like :' + c1 +
                (word.indexOf('#') === -1 ? '' : " escape '#'"),
                arg];
    }
    for (var i = 0;  i < words.length; i++) {
        var w = words[i];
        if (w.length) {
            var [sq, arg] = likeGenerateor(w);
            sql.push('(' + sq + ')');
            extend(args, arg);
        }
    }
    var res = [sql.join(' AND '), args];
    // p(sql.join(' AND '), keys(args), values(args));
    return res;
}

extend(Bookmark, {
    parseTags: function(str) {
        let [tags, ] = this.parse(str);
        return tags;
    },
    parse: function(str) {
        let re = /\[([^\[\]]+)\]/g;
        let match;
        let tags = [];
        let lastIndex = 0;
        while ((match = re.exec(str))) {
            lastIndex += match[0].length; 
            if (lastIndex == re.lastIndex) {
                let tag = match[1];
                if (!tags.some(function(t) tag == t))
                    tags.push(match[1]);
            }
        }
        let comment = str.substring(lastIndex) || '';

        return [tags, comment];
    },
    findByTags: function(tags, limit, ascending, offset) {
        tags = [].concat(tags);
        if (!tags.length) return [];
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
        let query = {
            where: 'id IN (' + bids.join(',') + ')',
            order: ascending ? 'date asc' : 'date desc'
        };
        if (limit)
            query.limit = limit;
        if (offset)
            query.offset = parseInt(offset);
        res = Bookmark.find(query);
        return res;
    },
    findRecent: function MB_findRecent(limit) {
        let query = { order: 'date DESC' };
        if (limit)
            query.limit = limit;
        return Bookmark.find(query);
    },
    search: function(str, limit, ascending, offset) {
        return Bookmark.searchImpl(str, limit, ascending, offset, 'search');
    },
    searchByTitle: function(str, limit, ascending, offset) {
        return Bookmark.searchImpl(str, limit, ascending, offset, 'title');
    },
    searchByUrl: function(str, limit, ascending, offset) {
        return Bookmark.searchImpl(str, limit, ascending, offset, 'url');
    },
    searchByComment: function(str, limit, ascending, offset) {
        return Bookmark.searchImpl(str, limit, ascending, offset, 'comment');
    },
    searchImpl: function(str, limit, ascending, offset, fieldName) {
        str = String(str).replace(/^\s+|\s+$/g, "");
        var res;
        p.b(function() {
        if (!str) {
            res = Bookmark.findRecent(limit);
        } else {
            var [sql, args] = createWhereLike(str, fieldName);
            //p('sql = ' + sql + '\nargs = ' + uneval(args));
            extend(args, {
                limit: limit || 10,
                order: ascending ? 'date asc' : 'date desc'
            });
            if (offset)
                args.offset = parseInt(offset);
            res = Bookmark.find(<>
                 select * from bookmarks
                 where {sql}
            </>.toString(), args);
        }
        }, 'Bookmark search [' + [fieldName, str, limit].join(' ') + ']');
        return res;
    },
    deleteByURLs: function (urls) {
        urls = [].concat(urls);
        if (!urls.length) return;
        Bookmark.db.beginTransaction();
        try {
            let query = "SELECT * FROM bookmarks WHERE url IN (" +
                        urls.map(function () "?").join() + ")";
            let bmIds = Bookmark.find(query, urls).map(function (b) b.id);
            if (!bmIds.length) throw "No bookmark to delete";
            Model.Tag.db.execute("DELETE FROM tags WHERE bookmark_id IN (" +
                                 bmIds.join() + ")");
            Bookmark.db.execute("DELETE FROM bookmarks WHERE id IN (" +
                                bmIds.join() + ")");
            Bookmark.db.commitTransaction();
        } catch (ex) {
            Bookmark.db.rollbackTransaction();
            return;
        }
        Model.Tag.clearTagCache();
        EventService.dispatch("BookmarksUpdated");
    },
    deleteBookmarks: function(bookmarks) {
        let bmIds = bookmarks.filter(function (b) b.id > 0)
                             .map(function (b) b.id);
        if (!bmIds.length) return;
        let placeholder = bmIds.map(function () "?").join(",");
        Model.Tag.db.execute("delete from tags where bookmark_id in (" +
                             placeholder + ")", bmIds);
        Bookmark.db.execute("delete from bookmarks where id in (" +
                            placeholder + ")", bmIds);
        Model.Tag.clearTagCache();
        EventService.dispatch("BookmarksUpdated");
    }
});

extend(Bookmark.prototype, {
    get entryURL() {
        return entryURL(this.url);
    },
    get imageURL() {
        return 'http://b.st-hatena.com/entry/image/' + this.url.replace('#', '%23');
    },
    get tags() {
        return Bookmark.parseTags(this.comment);
    },
    get body() {
        let [, body] = Bookmark.parse(this.comment);
        return body;
    },
    get favicon() {
        if (!this._favicon) {
            this._favicon = getFaviconURI(this.url);
        }
        return this._favicon.spec.toString();
    },
    get dateYMD() {
        let d = this.date.toString();
        return [d.substr(0,4), d.substr(4,2), d.substr(6,2)].join('/');
    },
    get dateObject() {
        let d = this.date.toString();
        return new Date(d.substring(0, 4), d.substring(4, 6) - 1,
                        d.substring(6, 8), d.substring(8, 10),
                        d.substring(10, 12), d.substring(12, 14));
    },
    get searchData() {
        let res = this.db.execute(<>
            SELECT
               id, title, comment, url
            FROM 
               bookmarks
            ORDER_BY date DESC;
        </>.toString());
        let data = [];
        for (let i = 0, len = res.length; i < len; i++) {
            data.push('\\0' + id + '\\0' + title + "\n" + comment + "\n" + url);
        }
        return data.join("\n");
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
        Model.Tag.clearTagCache();
    }
});

addAround(Bookmark, 'initialize', function(proceed, args, target) {
    proceed(args);
    target.db.connection.executeSimpleSQL('CREATE INDEX "bookmarks_date" ON "bookmarks" ("date" DESC)');
    target.db.connection.executeSimpleSQL('CREATE INDEX "bookmarks_date_asc" ON "bookmarks" ("date" ASC)');
});

addAround(Bookmark, 'searchBy*', function(proceed, args, target) {
    target.db.setPragma('case_sensitive_like', 0);
    try {
        return proceed(args);
    } finally {
        target.db.setPragma('case_sensitive_like', 1);
    }
});

addAround(Bookmark.prototype, 'save', function(proceed, args, target) {
    target.search = [target.title, target.comment, target.url].join("\n").toLowerCase(); // SQLite での検索用
    proceed(args);
    target.updateTags();
    Prefs.bookmark.set('everBookmarked', true);
});

addAround(Bookmark, 'rowToObject', function (proceed, args) {
    let obj = proceed(args);
    if (obj.title)
        obj.title = decodeReferences(obj.title).replace(/^\s+|\s+$/g, "");
    return obj;
});

Model.Bookmark = Bookmark;
Model.MODELS.push("Bookmark");


