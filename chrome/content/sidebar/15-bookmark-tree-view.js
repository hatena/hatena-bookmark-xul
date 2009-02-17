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

    showByTags: function (tags) {
        var prevRowCount = this.rowCount;
        this._items = Bookmark.findByTags.apply(Bookmark, tags);
        this._treeBox.rowCountChanged(0, -prevRowCount);
        this._treeBox.rowCountChanged(0, this.rowCount);
    },

    handleEvent: function (event) {
        switch (event.type) {
        case "select":
            if (event.target.id === "tag-tree")
                this.showByTags(event.target.view.wrappedJSObject.selectedTags);
            break;
        }
    }
});
