const EXPORT = ["EntryContext"];

function EntryContext(popup) {
    this.bookmark = null;
    this.bookmarks = null;
    popup._context = this;
}

extend(EntryContext.prototype, {
    build: function EC_build(target) {
        if (!target.bookmark) return false;
        this.bookmark  = target.bookmark;
        this.bookmarks = target.bookmarks || null;
        return true;
    },

    openIn: function EC_openIn(where) {
        openUILinkIn(this.bookmark.url, where);
    },

    openEntry: function EC_openEntry(event) {
        openUILink(this.bookmark.entryURL, event);
    },

    edit: function EC_edit() {
        getTopWin().hBookmark.AddPanelManager.currentPanel.show(this.bookmark);
    }
});
