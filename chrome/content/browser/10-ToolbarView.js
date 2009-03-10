const EXPORT = ["ToolbarView"];

function ToolbarView() {
    this._toolbar = null;
    this._bookmarks = [];
}

extend(ToolbarView.prototype, {
    get bookmarkCount TbV_get_bookmarkCount() this._bookmarks.length,
    getBookmarkAt: function TbV_getBookmarkAt(index) this._bookmarks[index],

    _updateBookmarks: function TbV__updateBookmarks() {
        this._bookmarks = Model.Bookmark.find({
            order: "date DESC",
            limit: Prefs.bookmark.get("toolbarMenuCount") || 10
        });
        p("[_updateBookmarks]",
          this._bookmarks.map(function (b) b.title).join("\n"));
        if (this._toolbar && this._toolbar.reset)
            this._toolbar.reset();
    },

    setToolbar: function TbV_setToolbar(toolbar) {
        this._toolbar = null; // 旧ツールバーのresetが呼ばれるのを防ぐ。
        this._updateBookmarks();
        this._toolbar = toolbar;
    },

    handleEvent: function TbV_handleEvent(event) {
        switch (event.type) {
        case "HBookmarkToolbarReady":
            p('HBookmarkToolbarReady event is fired');
            event.target.view = this;
            break;

        case "(bookmark added)":
            this._updateBookmarks();
            break;
        }
    }
});
