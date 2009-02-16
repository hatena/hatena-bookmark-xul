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
        var bm = this._bookmark;
        this._items = bm.findByTags.apply(bm, tags);
        this._treeBox.invalidate();
    }
});
