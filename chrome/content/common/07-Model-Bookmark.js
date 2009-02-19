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

extend(Bookmark, {
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
        res = Bookmark.find({
            where: 'id IN (' + bids.join(',') + ')'
        });
        return res;
    },
});

extend(Bookmark.prototype, {
    get tags(comment) {
        return Bookmark.parseTags(this.comment);
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
    target.search = [target.title, target.comment, target.url].join("\0"); // SQLite での検索用
    proceed(args);
    target.updateTags();
});

Model.Bookmark = Bookmark;
Model.MODELS.push("Bookmark");
