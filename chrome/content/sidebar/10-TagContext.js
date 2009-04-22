const EXPORT = ["TagContext"];

function getURIFor(pageType) {
    let base = "http://b.hatena.ne.jp/";
    let userBase = base + User.user.name + "/";
    switch (pageType.toLowerCase()) {
    case "tags":
        let tags = arguments[1];
        return userBase + tags.map(encodeURIComponent).join("/") + "/";

    case "edittag":
        let tag = arguments[1];
        return userBase + "tag?tag=" + encodeURIComponent(tag);
    }
}

function TagContext() {
    this.tags = null;
}

extend(TagContext.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/popups.properties"),

    build: function TC_build(popup) {
        let target = document.popupNode;
        let tags = target.tags;
        if (!tags || !tags.length) return false;
        this.tags = tags.concat();
        this.tag = tags[tags.length - 1];
        let tagsLabel = this._formatTags(this.tags);
        this._setLabel("openBookmarks", [tagsLabel]);
        this._setLabel("deleteBookmarks", [tagsLabel]);
        this._setLabel("editTag", [this.tag]);
        this._setLabel("filterToolbar", [this.tag]);
        let line = this._toolbarRecentLine;
        this._getItem("filterToolbar").hidden =
            !line || !UIUtils.isVisible(line);
        return true;
    },

    _getItem: function TC__getItem(key) {
        return document.getElementById("hBookmark-tag-context-" + key);
    },

    _setLabel: function TC__setLabel(key, args) {
        let item = this._getItem(key);
        let label = this.strings.get("tagContext." + key + "Label", args);
        item.setAttribute("label", label);
        let accessKey = this.strings.get("tagContext." + key + "Key");
        item.setAttribute("accesskey", accessKey);
    },

    _formatTags: function TC__formatTags(tags) "[" + tags.join("][") + "]",

    destroy: function TC_destory() {
        this.tags = null;
    },

    get bookmarks TC_get_bookmarks() Model.Bookmark.findByTags(this.tags),

    openBookmarks: function TC_openBookmarks(event) {
        let urls = this.bookmarks.map(function (b) b.url);
        UIUtils.openLinks(urls, event);
    },

    openIn: function TC_opneIn(where) {
        let url = getURIFor("tags", this.tags);
        openUILinkIn(url, where);
    },

    /*
    delete: function TC_delete() {
        let tag = this.tags.pop();
        alert('Not implemented');
    },

    rename: function TC_rename() {
        let tag = this.tags.pop();
        alert('Not implemented');
    },
    */

    filterToolbar: function TC_filterToolbar() {
        this._toolbarRecentLine.tagFilterPopup.setTag(this.tag);
    },

    get _toolbarRecentLine TC_get__toolbarRecentLine() {
        return getTopWin().document.getElementById("hBookmark-toolbar-recent-line");
    },

    editTag: function TC_editTag(event) {
        let url = getURIFor("editTag", this.tag);
        hOpenUILink(url, event);
    },

    deleteBookmarks: function TC_deleteBookmarks() {
        let bookmarks = this.bookmarks;
        if (!UIUtils.confirmDeleteBookmarks(bookmarks)) return;
        let command = new RemoteCommand("delete", {
            bookmarks: bookmarks,
            onError: function () {
                UIUtils.alertBookmarkError("delete", bookmarks);
            }
        });
        command.execute();
    }
});
