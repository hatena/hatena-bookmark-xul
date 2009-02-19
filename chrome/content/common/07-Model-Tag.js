let Tag = Model.Entity({
    name : 'tags',
    fields : {
        id           : 'INTEGER PRIMARY KEY',
        bookmark_id  : 'INTEGER NOT NULL',
        name         : 'TEXT',
    }
});

extend(Tag, {
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
    },

    deleteByNames: function Tag_deleteByNames(names) {
        Tag.rename(names, null);
    },

    rename: function Tag_rename(oldName, newName) {
        const Bookmark = Model.Bookmark;
        let oldNames = [].concat(oldName);
        let bookmarks = Bookmark.findByTags(oldNames);
        if (!bookmarks.length) return;
        oldName = oldNames[oldNames.length - 1];
        let re = new RegExp("^((?:\\[.*?\\])*?)\\[" +
                            oldName.replace(/[^\w\u0100-\uffff]/g, "\\$&") +
                            "\\]");
        // XXX newNameが空文字列だった場合は?
        // XXX newNameに"["、"]"が含まれていた場合は?
        let replacement = newName ? "$1[" + newName + "]" : "$1";
        Bookmark.db.beginTransaction();
        bookmarks.forEach(function (bookmark) {
            bookmark.comment = bookmark.comment.replace(re, replacement);
            bookmark.save();
        });
        Bookmark.db.commitTransaction();
    }
});

Model.Tag = Tag;
Model.MODELS.push("Tag");
