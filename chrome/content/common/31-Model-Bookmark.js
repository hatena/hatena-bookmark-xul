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

let createWhereLike = function (word) {
    // sqlite での検索は case_sensitive_like = 1 で行った方が速いため
    var words = word.toLowerCase().split(/\s+/);
    var sql = [];
    var args = {};
    var c = 0;
    var likeGenerateor = function(word) {
        var word = '%' + word + '%';
        var c1 = 'arg' + c++;
        var arg = {};
        arg[c1] = word;
        return [<>
          search like :{c1}
        </>.toString(), arg];
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
    findByTags: function(tags) {
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
        res = Bookmark.find({
            where: 'id IN (' + bids.join(',') + ')'
        });
        return res;
    },
    findRecent: function MB_findRecent(count) {
        count = count || Prefs.bookmark.get('recentItemCount');
        return Bookmark.find({
            limit: count,
            order: 'date desc'
        });
    },
    search: function(str, limit) {
        var res;
        p.b(function() {
        if (!str) {
            res = Bookmark.findRecent(limit);
        } else {
            Bookmark.db.connection.executeSimpleSQL('PRAGMA case_sensitive_like = 1');
            var [sql, args] = createWhereLike(str);
            extend(args, {
                limit: limit || 10,
                order: 'date desc',
            });
            res = Bookmark.find(<>
                 select * from bookmarks
                 where {sql}
            </>.toString(), args);
        }
        }, 'Bookmark search [' + [str, limit].join(' ') + ']');
        return res;
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
        EventService.dispatch("BookmarksUpdated");
    }
});

extend(Bookmark.prototype, {
    get entryURL() {
        return entryURL(this.url);
    },
    get imageURL() {
        return 'http://b.hatena.ne.jp/entry/image/' + this.url.replace('#', '%23');
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
    }
});

addAround(Bookmark, 'initialize', function(proceed, args, target) {
    proceed(args);
    target.db.connection.executeSimpleSQL('CREATE INDEX "bookmarks_date" ON "bookmarks" ("date" DESC)');
    target.db.connection.executeSimpleSQL('CREATE INDEX "bookmarks_date_asc" ON "bookmarks" ("date" ASC)');
});

addAround(Bookmark.prototype, 'save', function(proceed, args, target) {
    target.search = [target.title, target.comment, target.url].join("\n").toLowerCase(); // SQLite での検索用
    proceed(args);
    target.updateTags();
});

addAround(Bookmark, 'rowToObject', function (proceed, args) {
    let obj = proceed(args);
    obj.title = obj.title.replace(/&#(\d+);/g,
                                  function (m, n) String.fromCharCode(n));
    return obj;
});

Model.Bookmark = Bookmark;
Model.MODELS.push("Bookmark");


