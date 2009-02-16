const EXPORTED_SYMBOLS = ["TagTreeView"];

Components.utils.import("resource://hatenabookmark/modules/base.jsm");
require("ModelTemp");
require("Widget.TreeView");

extendBuiltIns();

const AtomService = Components.classes["@mozilla.org/atom-service;1"]
                        .getService(Components.interfaces.nsIAtomService);

function TagTreeItem(tag, parentItem) {
    this.currentTag = tag;
    this.parent = parentItem;
    this.index = -1;
    this.tags = parentItem ? parentItem.tags.concat(tag) : [];
    this.level = parentItem ? parentItem.level + 1 : -1;
    this.hasNext = true;
    this.isOpen = false;
    this.isEmpty = null;
}

function TagTreeView() {
    this._visibleItems = [];
    this._rootItem = new TagTreeItem();
    this._treeBox = null;
    this._model = model("Tag"); // XXX モデルをどうこうしたい。
    this.selection = null;
}

TagTreeView.prototype.__proto__ = Widget.TreeView.prototype;
extend(TagTreeView.prototype, {
    get rowCount () this._visibleItems.length,
    getCellText: function (row, col) this._visibleItems[row].currentTag,
    setTree: function (treeBox) {
        this._treeBox = treeBox;
        this._openRelatedTags(this._rootItem);
        this._visibleItems.forEach(function (item, i) item.index = i);
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
    isContainerOpen: function (index) this._visibleItems[index].isOpen,
    isContainerEmpty: function (index) {
        var item = this._visibleItems[index];
        if (item.isEmpty === null)
            item.isEmpty = this._model.findRelatedTags(item.tags).length === 0;
        return item.isEmpty;
    },

    getCellProperties: function (row, col, properties) {
        properties.AppendElement(AtomService.getAtom("Name"));
    },

    toggleOpenState: function (index) {
        var visibleItems = this._visibleItems;
        var item = visibleItems[index];
        var changedCount = item.isOpen
            ? this._closeRelatedTags(item) : this._openRelatedTags(item);
        if (changedCount) {
            item.isOpen = !item.isOpen;
            for (var i = index + 1; i < visibleItems.length; i++)
                visibleItems[i].index = i;
            this._treeBox.rowCountChanged(index + 1, changedCount);
        } else {
            item.isOpen = false;
            item.isEmpty = true;
        }
        this._treeBox.invalidateRow(index);
    },

    _openRelatedTags: function (parentItem) {
        var tags = this._model.findRelatedTags(parentItem.tags);
        var items = tags.map(function (t) new TagTreeItem(t.name, parentItem));
        if (items.length)
            items[items.length - 1].hasNext = false;
        var visibleItems = this._visibleItems;
        var startIndex = parentItem.index + 1;
        visibleItems.splice.apply(visibleItems, [startIndex, 0].concat(items));
        return items.length;
    },

    _closeRelatedTags: function (parentItem) {
        var visibleItems = this._visibleItems;
        var startIndex = parentItem.index + 1;
        var endIndex = startIndex;
        var currentLevel = parentItem.level;
        while (endIndex < visibleItems.length &&
               visibleItems[endIndex].level > currentLevel)
            endIndex++;
        visibleItems.splice(startIndex, endIndex - startIndex);
        return startIndex - endIndex;
    },

    get selectedTags () {
        return this._visibleItems[this.selection.currentIndex].tags.concat();
    }
});
