const EXPORT = ["BookmarkTreeView"];

var Bookmark = model("Bookmark");

function BookmarkTreeView() {
    this.selection = null;
    this._items = [];
    this._treeBox = null;
    this._shownBy = "search";
    this._searchString = "";
    this._tags = null;

}

BookmarkTreeView.prototype.__proto__ = TreeView.prototype;
extend(BookmarkTreeView.prototype, {
    get rowCount () this._items.length,
    getCellText: function (row, col) this._items[row].title,
    setTree: function (treeBox) {
        this._treeBox = treeBox;
        if (!treeBox) return;
        this.update();
    },

    getImageSrc: function BTV_getImageSrc(row, col) {
        return favicon(this._items[row].url);
    },

    showByTags: function (tags) {
        this._shownBy = "tags";
        this._tags = tags;
        let bookmarks = Bookmark.findByTags(tags);
        this.setBookmarks(bookmarks);
    },

    showBySearchString: function BTV_showBySearchString(string) {
        let visibleRowCount = this._treeBox.getPageLength();
        this._shownBy = "search";
        this._searchString = string;
        let bookmarks = string
            ? Bookmark.search(string, visibleRowCount)
            : Bookmark.findRecent(visibleRowCount);
        this.setBookmarks(bookmarks);
    },

    setBookmarks: function BTV_setBookmarks(bookmarks) {
        let prevRowCount = this.rowCount;
        this._items = bookmarks;
        this._treeBox.treeBody.bookmarks = bookmarks;
        this._treeBox.rowCountChanged(0, -prevRowCount);
        this._treeBox.rowCountChanged(0, this.rowCount);
    },

    handleEvent: function (event) {
        switch (event.type) {
        case "HB_TagsSelected":
            let tags = event.originalTarget.tags;
            if (tags)
                this.showByTags(tags);
            break;

        case "BookmarksUpdated":
            this.update();
            break;

        case "input":
            this.showBySearchString(event.target.value);
            break;

        case "select":
            this.handleSelect();
            break;

        case "click":
            this.handleClick(event);
            break;

        case "keypress":
            this.handleKeyPress(event);
            break;
        }
    },

    update: function BTV_update() {
        switch (this._shownBy) {
        case "search": this.showBySearchString(this._searchString); break;
        case "tags":   this.showByTags(this._tags);                 break;
        }
    },

    handleSelect: function BTV_handleSelect() {
        let row = this.selection.currentIndex;
        let bookmark = (row === -1) ? null : this._items[row];
        this._treeBox.treeBody.bookmark = bookmark;
    },

    handleClick: function BTV_handleClick(event) {
        if (event.button > 1) return;
        let row = {};
        this._treeBox.getCellAt(event.clientX, event.clientY, row, {}, {});
        if (row.value === -1) return;
        let bookmark = this._items[row.value];
        openUILink(bookmark.url, event);
    },

    handleKeyPress: function BTV_handleKeyPress(event) {
        let row = this.selection.currentIndex;
        if (event.keyCode !== KeyEvent.DOM_VK_RETURN || row === -1) return;
        let bookmark = this._items[row];
        openUILink(bookmark.url, event);
    }
});
