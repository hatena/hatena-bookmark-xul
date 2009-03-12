const EXPORT = ["BookmarkTreeView"];

var Bookmark = model("Bookmark");

function BookmarkTreeView() {
    this.selection = null;
    this._items = [];
    this._treeBox = null;
}

BookmarkTreeView.prototype.__proto__ = TreeView.prototype;
extend(BookmarkTreeView.prototype, {
    get rowCount () this._items.length,
    getCellText: function (row, col) this._items[row].title,
    setTree: function (treeBox) {
        this._treeBox = treeBox;
    },

    getImageSrc: function BTV_getImageSrc(row, col) {
        return favicon(this._items[row].url);
    },

    showByTags: function (tags) {
        var prevRowCount = this.rowCount;
        this._items = Bookmark.findByTags(tags);
        this._treeBox.rowCountChanged(0, -prevRowCount);
        this._treeBox.rowCountChanged(0, this.rowCount);
    },

    handleEvent: function (event) {
        switch (event.type) {
        case "select":
            if (event.target.id === "tag-tree")
                this.showByTags(event.target.view.wrappedJSObject.selectedTags);
            else if (event.target.treeBoxObject === this._treeBox)
                this.setBookmark();
            break;

        case "click":
            this.handleClick(event);
            break;

        case "keypress":
            this.handleKeyPress(event);
            break;
        }
    },

    setBookmark: function BTV_setBookmark() {
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
