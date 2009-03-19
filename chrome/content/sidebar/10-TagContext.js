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
        let tags = document.popupNode.tags;
        if (!tags || !tags.length) return false;
        this.tags = tags.concat();
        this.tag = tags[tags.length - 1];
        let editTagItem =
            document.getElementById("hBookmarkTagContext_editTag");
        editTagItem.label =
            this.strings.get("tagContext.editTagLabel", [this.tag]);
        editTagItem.accessKey = this.strings.get("tagContext.editTagKey");
        return true;
    },

    get bookmarks TC_get_bookmarks() Model.Bookmark.findByTags(this.tags),

    openBookmarks: function TC_openBookmarks(event) {
        let urls = this.bookmarks.map(function (b) b.url);
        BrowserWindow.openLinks(urls, event);
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
    editTag: function TC_editTag(event) {
        let url = getURIFor("editTag", this.tag);
        openUILink(url, event);
    },
    deleteBookmarks: function TC_deleteBookmarks() {
        let bookmarks = this.bookmarks;
        if (!UIUtils.confirmDeleteBookmarks(bookmarks)) return;
        let command = new RemoteCommand("delete", {
            bookmarks: bookmarks,
            onError: function () {
                //UIUtils.notifyError();
                p('Failed to remove bookmarks',
                  bookmarks.map(function (b) b.url).join("\n"));
            }
        });
        command.execute();
    }
});
