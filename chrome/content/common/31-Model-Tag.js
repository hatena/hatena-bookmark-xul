let Tag = Model.Entity({
    name : 'tags',
    fields : {
        id           : 'INTEGER PRIMARY KEY',
        bookmark_id  : 'INTEGER NOT NULL',
        name         : 'TEXT',
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
        // XXX bmIdsをプレースホルダにするとブックマーク件数が多いとき落ちる
        let query = "select count(name) as `count`, name from tags " +
                    "where name not in (" +
                    tagNames.map(function () "?").join() +
                    ") and bookmark_id in (" +
                    bmIds.join() +
                    ") group by name";
        return this.find(query, tagNames);
    },

    findTagCandidates: function Tag_findTagCandidates(partialTag) {
        if (!partialTag) return [];
        return this.find({
            where: "name LIKE :pattern ESCAPE '#'",
            // XXX SQLインジェクションの可能性について要検証
            pattern: partialTag.replace(/[#_%]/g, "#$&") + "%",
            group: "name"
        });
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

Model.Tag = Tag;
Model.MODELS.push("Tag");

