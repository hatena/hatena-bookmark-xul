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
        this._items = Bookmark.findByTags(tags);
        this._treeBox.rowCountChanged(0, -prevRowCount);
        this._treeBox.rowCountChanged(0, this.rowCount);
    },

    handleEvent: function (event) {
        switch (event.type) {
        case "select":
            if (event.target.id === "tag-tree")
                this.showByTags(event.target.view.wrappedJSObject.selectedTags);
            break;

        case "click":
            this.handleClickEvent(event);
            break;
        }
    },

    handleClickEvent: function BTV_handleClickEvent(event) {
        if (event.button !== 0) return;
        let row = {};
        this._treeBox.getCellAt(event.clientX, event.clientY, row, {}, {});
        if (row.value === -1) return;
        let uriSpec = this._items[row.value].url;
        let uri = IOService.newURI(uriSpec, null, null)
        Application.activeWindow.activeTab.load(uri);
    }
});
