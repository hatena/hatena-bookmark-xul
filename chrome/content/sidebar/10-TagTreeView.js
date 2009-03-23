const EXPORT = ["TagTreeView"];

const AtomService =
    Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);

var Tag = model("Tag");

function TagTreeItem(tag, parentItem) {
    this.currentTag = tag && tag.name;
    this.count = tag && tag.count;
    this.parent = parentItem;
    this.index = -1;
    this.tags = parentItem ? parentItem.tags.concat(tag.name) : [];
    this.level = parentItem ? parentItem.level + 1 : -1;
    this.hasNext = true;
    this.isOpen = false;
    this.isEmpty = null;
}

function TagTreeView() {
    this._visibleItems = [];
    this._rootItem = new TagTreeItem();
    this._treeBox = null;
    this.selection = null;
}

TagTreeView.prototype.__proto__ = TreeView.prototype;
extend(TagTreeView.prototype, {
    get rowCount () this._visibleItems.length,
    getCellText: function (row, col) {
        let field = col.id.substring("hBookmarkTagTree_".length);
        return this._visibleItems[row][field];
    },
    setTree: function (treeBox) {
        this._treeBox = treeBox;
        if (!treeBox) return;
        this._treeBox.treeBody.tags = [];
        this._openRelatedTags(this._rootItem);
        this._visibleItems.forEach(function (item, i) item.index = i);
    },

    getLevel: function (index) this._visibleItems[index].level,
    hasNextSibling: function (rowIndex, afterIndex) {
        return this._visibleItems[rowIndex].hasNext;
    },
    getParentIndex: function (rowIndex) {
        return this._visibleItems[rowIndex].parent.index;
    },

    isContainer: function (index) true,
    isContainerOpen: function (index) this._visibleItems[index].isOpen,
    isContainerEmpty: function (index) {
        var item = this._visibleItems[index];
        if (item.isEmpty === null)
            item.isEmpty = !Tag.findRelatedTags(item.tags).length;
        return item.isEmpty;
    },

    getCellProperties: function (row, col, properties) {
        if (col.id === "hBookmarkTagTree_currentTag")
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
        var tags = Tag.findRelatedTags(parentItem.tags);
        if (!tags.length) return 0;
        var items = tags.map(function (t) new TagTreeItem(t, parentItem));
        items[items.length - 1].hasNext = false;
        var visibleItems = this._visibleItems;
        var spliceArgs = [parentItem.index + 1, 0].concat(items);
        visibleItems.splice.apply(visibleItems, spliceArgs);
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
        var index = this.selection.currentIndex;
        return (index === -1) ? [] : this._visibleItems[index].tags.concat();
    },

    handleEvent: function TTV_handleEvent(event) {
        switch (event.type) {
        case "select":
            this.setTags();
            break;

        case "click":
            this.handleClick(event);
            break;
        }
    },

    setTags: function TTV_setTags() {
        let treeChildren = this._treeBox.treeBody;
        let index = this.selection.currentIndex;
        treeChildren.tags = (index === -1)
            ? [] : this._visibleItems[index].tags.concat();

        let event = document.createEvent("Event");
        event.initEvent("HB_TagsSelected", true, false);
        treeChildren.dispatchEvent(event);
    },

    handleClick: function TTV_handleClick(event) {
        if (event.button !== 0) return;
        var row = {};
        var child = {};
        this._treeBox.getCellAt(event.clientX, event.clientY, row, {}, child);
        if (row.value === -1 || child.value === "twisty") return;
        this.toggleOpenState(row.value);
    }
});
