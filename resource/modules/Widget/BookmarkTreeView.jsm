const EXPORTED_SYMBOLS = ["BookmarkTreeView"];

Components.utils.import("resource://hatenabookmark/modules/base.jsm");
require("ModelTemp");
require("Widget.TreeView");

function BookmarkTreeView() {
    this.selection = null;
    this._items = [];
    this._treeBox = null;
    this._bookmark = model("Bookmark"); // XXX モデルをどうこうしたい。
}

BookmarkTreeView.prototype.__proto__ = Widget.TreeView.prototype;
extend(BookmarkTreeView.prototype, {
    get rowCount () this._items.length,
    getCellText: function (row, col) this._items[row].title,
    setTree: function (treeBox) {
        this._treeBox = treeBox;
    },

    showByTags: function (tags) {
        var prevRowCount = this.rowCount;
        var Bookmark = this._bookmark;
        this._items = Bookmark.findByTags.apply(Bookmark, tags)
            .map(function (tag) Bookmark.findById(tag.bookmark_id)[0]);
        this._treeBox.rowCountChanged(0, -prevRowCount);
        this._treeBox.rowCountChanged(0, this.rowCount);
    }
});
