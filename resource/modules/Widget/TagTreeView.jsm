const EXPORTED_SYMBOLS = ["TagTreeView"];

Components.utils.import("resource://hatenabookmark/modules/base.jsm");
require("ModelTemp");
require("Widget.TreeView");

extendBuiltIns(this);

const AtomService = Components.classes["@mozilla.org/atom-service;1"]
                        .getService(Components.interfaces.nsIAtomService);

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
    this._model = model("Tag"); // XXX モデルをどうこうしたい。
}

TagTreeView.prototype.__proto__ = Widget.TreeView.prototype;
extend(TagTreeView.prototype, {
    get rowCount () this._visibleItems.length,
    getCellText: function (row, col) this._visibleItems[row].currentTag,
    setTree: function (treeBox) {
        this._treeBox = treeBox;
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

    isContainer: function (index) true,
    isContainerEmpty: function (index) this._visibleItems[index].isEmpty,
    isContainerOpen: function (index) this._visibleItems[index].isOpen,

    getCellProperties: function (row, col, properties) {
        properties.AppendElement(AtomService.getAtom("Name"));
    },

    toggleOpenState: function (index) {
        var item = this._visibleItems[index];
        if (item.isOpen)
            this._closeRelatedTags(item);
        else
            this._openRelatedTags(item);
    },

    _openRelatedTags: function (parentItem) {
        var tags = parentItem
            ? this._model.findRelatedTags(parentItem.tags)
            : this._model.findDistinctTags();
        var items = tags.map(function (t) new TagTreeItem(t.name, parentItem));
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
        this._treeBox.invalidateRow(parentItem.index);
    },

    _closeRelatedTags: function (parentItem) {
        if (!parentItem.isOpen) return;
        var visibleItems = this._visibleItems;
        var startIndex = parentItem.index + 1;
        var endIndex = startIndex;
        var currentLevel = parentItem.level;
        while (endIndex < visibleItems.length &&
               visibleItems[endIndex].level > currentLevel)
            endIndex++;
        visibleItems.splice(startIndex, endIndex - startIndex);
        for (var i = startIndex; i < visibleItems.length; i++)
            visibleItems[i].index = i;

        parentItem.isOpen = false;
        parentItem.isEmpty = false;
        this._treeBox.rowCountChanged(startIndex, startIndex - endIndex);
        this._treeBox.invalidateRow(parentItem.index);
    }
});
