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
    var words = word.split(/\s+/);
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
        /*
         * XXX: [hoge][huga] foo [baz] の baz もまっちしてしまう
         */
        let regex = new RegExp('\\[([^\:\\[\\]]+)\\]', 'g');
        let match;
        let tags = [];
        let lastIndex = 0;
        while (( match = regex.exec(str) )) {
            tags.push(match[1]);
            lastIndex = regex.lastIndex;
        }
        return [tags, str.substring(lastIndex)];
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
    search: function(str, limit) {
        var [sql, args] = createWhereLike(str || '');
        extend(args, {
            limit: limit || 10,
            order: 'date desc',
        });
        var res = Bookmark.find(<>
             select * from bookmarks
             where {sql}
        </>.toString(), args);
        return res;
    }
});

extend(Bookmark.prototype, {
    get entryURL() {
        return 'http://b.hatena.ne.jp/entry/' + this.url.replace('#', '%23');
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
    target.search = [target.title, target.comment, target.url].join("\n"); // SQLite での検索用
    proceed(args);
    target.updateTags();
});

Model.Bookmark = Bookmark;
Model.MODELS.push("Bookmark");


