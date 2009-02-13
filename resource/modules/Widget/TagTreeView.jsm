const EXPORTED_SYMBOLS = ["TagTreeView"];

Components.import("resource://hatenabookmark/modules/base.jsm");
require("Widget.TreeView");

function TagTreeItem(tag, parentItem) {
    this.currentTag = tag;
    this.parent = parentItem;
    this.index = -1;
    this.tags = parentItem ? parentItem.tags.concat(tag) : [tag];
    this.level = parentItem ? parentItem.level + 1 : 0;
    this.hasNext = true;
    this.isOpen = false;
    this.isEmpty = false;
}

function TagTreeView() {
    this._visibleItems = [];
    this._treeBox = null;
    this._model = {}; // XXX モデルの作成と設定
}

TagTreeView.prototype.__proto__ = TreeView.prototype;
extend(TreeView.prototype, {
    get rowCount () this._visibleItems.length,
    getCellText: function (row, col) this._visibleItems[row].currentTag,
    setTree: function (treeBox) {
        this.treeBox = treeBox;
        this._openRelatedTags(null);
    },

    getLevel: function (index) this._visibleItems[index].level,
    hasNextSibling: function (rowIndex, afterIndex) {
        return this._visibleItems[rowIndex].hasNext;
    },
    getParentIndex: function (rowIndex) {
        var parent = this._visibleItems[rowIndex].parent;
        return parent ? parent.index : -1;
    },

    toggleOpenState: function (index) {
        // TBD
    },

    isContainer: function (index) true,
    isContainerEmpty: function (index) this._visibleItems[index].isEmpty,
    isContainerOpen: function (index) this._visibleItems[index].isOpen,

    _openRelatedTags: function (parentItem) {
        var tags = parentItem
            ? this._model.getRelatedTags(parentItem.tags)
            : this._model.getAllTags();
        var items = tags.map(function (tag) new TagTreeItem(tag, parentItem));
        if (items.length)
            items[items.length - 1].hasNext = false;
        var visibleItems = this._visibleItems;
        var startIndex = parentItem ? parentItem.index + 1 : 0;
        visibleItems.splice.apply(visibleItems, [startIndex, 0].concat(items));
        for (var i = startIndex; i < visibleItems.length; i++)
            visibleItems[i].index = i;
        if (!parentItem) return;

        parentItem.isOpen = true;
        if (!items.length)
            parentItem.isEmpty = true;
        this._treeBox.rowCountChanged(startIndex, items.length);
        this._treeBox.invalidateRow(startIndex - 1);
    }
});
