const EXPORT = ["TagContext"];

function TagContext() {
    this.tags = null;
}

extend(TagContext.prototype, {
    build: function TC_build(popup) {
        let tags = document.popupNode.tags;
        if (!tags || !tags.length) return false;
        this.tags = tags.concat();
        return true;
    },

    openAllBookmarks: function TC_openAllBookmarks(event) {
        let bookmarks = Model.Bookmark.findByTags(this.tags);
        let urls = bookmarks.map(function (b) b.url);
        BrowserWindow.openLinks(urls, event);
    },
    openIn: function TC_opneIn(where) {
        let url = "http://b.hatena.ne.jp/" + User.user.name +
                  "/" + this.tags.map(encodeURIComponent).join("/");
        openUILinkIn(url, where);
    },
    delete: function TC_delete() {
        let tag = this.tags.pop();
        alert('Not implemented');
    },
    rename: function TC_rename() {
        let tag = this.tags.pop();
        alert('Not implemented');
    }
});
