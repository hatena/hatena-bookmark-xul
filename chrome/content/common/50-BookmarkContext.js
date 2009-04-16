const EXPORT = ["BookmarkContext"];

function BookmarkContext(popup) {
    this.bookmark = null;
    this.bookmarks = null;
    popup._context = this;
}

extend(BookmarkContext.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/popups.properties"),

    build: function EC_build(target) {
        target = UIUtils.getBookmarkElement(target);
        if (!target || !target.bookmark) return false;
        this.bookmark  = target.bookmark;
        this.bookmarks = target.bookmarks || null;
        this._getItem("deleteAll").hidden = !this.bookmarks;
        if (Prefs.link.get("openInNewTab")) {
            this._getItem("open").removeAttribute("default");
            this._getItem("openInNewTab").setAttribute("default", "true");
        } else {
            this._getItem("open").setAttribute("default", "true");
            this._getItem("openInNewTab").removeAttribute("default");
        }
        return true;
    },

    _getItem: function EC__getItem(key) {
        return document.getElementById("hBookmark-bookmark-context-" + key);
    },

    openIn: function EC_openIn(where) {
        openUILinkIn(this.bookmark.url, where);
    },

    openEntry: function EC_openEntry(event) {
        hOpenUILink(this.bookmark.entryURL, event);
    },

    edit: function EC_edit() {
        getTopWin().hBookmark.AddPanelManager.showPanel(this.bookmark);
    },

    delete: function EC_delete() {
        let bookmark = this.bookmark;
        let command = new RemoteCommand('delete', {
            bookmark: bookmark,
            onError: function () {
                UIUtils.alertBookmarkError('delete', bookmark);
            }
        });
        command.execute();
    },

    deleteAll: function EC_deleteAll() {
        let bookmarks = this.bookmarks;
        if (!UIUtils.confirmDeleteBookmarks(bookmarks)) return;
        let command = new RemoteCommand('delete', {
            bookmarks: bookmarks,
            onError: function () {
                UIUtils.alertBookmarkError('delete', bookmarks);
            }
        });
        command.execute();
    }
});
