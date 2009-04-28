let Tag = Model.Entity({
    name : 'tags',
    fields : {
        id           : 'INTEGER PRIMARY KEY',
        bookmark_id  : 'INTEGER NOT NULL',
        name         : 'TEXT COLLATE NOCASE',
    }
});

extend(Tag, {
    findDistinctTags: function (count) {
        let query = 'select count(name) as `count`, name from tags group by name';
        if (count) query += ' order by count desc limit ' + +count;
        let tags = this.find(query);
        // count 順になったのを元に戻す
        if (count) tags.sort(function (a, b) a.name > b.name ? 1 : -1);
        return tags;
    },

    findRelatedTags: function (tagNames, limit) {
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
        // XXX bmIdsをプレースホルダにするとブックマーク件数が多いとき落ちる
        let query = "select count(name) as `count`, name from tags " +
                    "where name not in (" +
                    tagNames.map(function () "?").join() +
                    ") and bookmark_id in (" +
                    bmIds.join() +
                    ") group by name";
        if (limit) {
            query += " limit ?";
            tagNames = tagNames.concat(+limit);
        }
        return this.find(query, tagNames);
    },

    hasRelatedTags: function Tag_hasRelatedTags(tagNames) {
        if (!tagNames || !tagNames.length)
            return !!this.countAll();

        let tagCache = shared.get("relatedTagCache");
        if (!tagCache) {
            tagCache = new DictionaryObject();
            shared.set("relatedTagCache", tagCache);
        }
        let keys = tagNames.map(function (t) t.toLowerCase() + "[]");
        let leafKey = keys.pop();
        let branchKey = keys.sort().join("");
        if (!(branchKey in tagCache)) {
            p("create relatedTagCache for " + branchKey);
            let query = "SELECT DISTINCT name FROM tags WHERE ";
            let conditions = keys.map(function ()
                "bookmark_id IN (SELECT bookmark_id FROM tags WHERE name = ?)");
            conditions.push("bookmark_id IN (SELECT bookmark_id FROM tags " +
                            "GROUP BY bookmark_id HAVING count(*) > " +
                            tagNames.length + ")");
            query += conditions.join(" AND ");
            let tags = Tag.find(query, tagNames.slice(0, -1));
            tagCache[branchKey] = tags.reduce(function (cache, tag) {
                cache[tag.name.toLowerCase() + "[]"] = true;
                return cache;
            }, new DictionaryObject());
        }
        return leafKey in tagCache[branchKey];
    },

    clearRelatedTagCache: function Tag_clearRelatedTagCache() {
        shared.set("relatedTagCache", null);
    },

    deleteByName: function Tag_deleteByName(name) Tag.rename(name, null),

    rename: function Tag_rename(oldName, newName) {
        const Bookmark = Model.Bookmark;
        let bookmarks = Bookmark.findByTags([oldName]);
        if (!bookmarks.length) return;
        let re = new RegExp("^((?:\\[.*?\\])*?)\\[" +
                            oldName.replace(/[^\w\u0100-\uffff]/g, "\\$&") +
                            "\\]");
        // XXX newNameが空文字列だった場合は?
        // XXX newNameに"["、"]"が含まれていた場合は?
        let replacement = newName ? "$1[" + newName + "]" : "$1";
        Bookmark.db.beginTransaction();
        bookmarks.forEach(function (bookmark) {
            bookmark.comment = bookmark.comment.replace(re, replacement);
            // XXX 例外発生の可能性あり?
            bookmark.save();
        });
        Bookmark.db.commitTransaction();
        // XXX delete時には別のイベントを発行すべき?
        EventService.dispatch("TagNameChanged", { from :oldName, to: newName });
    }
});

// addAround(Tag.prototype, "save", function(proceed, args, target) {
//     target.lcname = target.name.toLowerCase();
//     proceed(args);
// });

Model.Tag = Tag;
Model.MODELS.push("Tag");

