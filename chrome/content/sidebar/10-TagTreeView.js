const EXPORT = ["TagTreeView"];

const AtomService =
    Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
const NAME_ATOM = AtomService.getAtom("Name");
const TAG_ATOM = AtomService.getAtom("tag");
const COUNT_ATOM = AtomService.getAtom("count");

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
    this._sortBy = null;
    this._sortDir = null;
    this.selection = null;
}

let $maxCount = 28, $count, $start;

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
        $count = 0; $start = new Date();
        this._treeBox.treeBody.tags = [];
        this._setSortKey();
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
        if ($count === 0) $start = new Date();
        if (item.isEmpty === null)
            item.isEmpty = !Tag.hasRelatedTags(item.tags);
        if (++$count === $maxCount)
            p("Benchmark isContainerEmpty: " + (new Date() - $start));
        return item.isEmpty;
    },

    getCellProperties: function (row, col, properties) {
        switch (col.id) {
        case "hBookmarkTagTree_currentTag":
            properties.AppendElement(NAME_ATOM); // XXX To be removed
            properties.AppendElement(TAG_ATOM);
            break;

        case "hBookmarkTagTree_count":
            properties.AppendElement(COUNT_ATOM);
            break;
        }
    },

    cycleHeader: function TTV_cycleHeader(col) {
        let sortDir = col.element.getAttribute("sortDirection");
        sortDir = (sortDir === "ascending")  ? "descending" :
                  (sortDir === "descending") ? "natural"    : "ascending";
        let cols = col.columns;
        for (let c = cols.getFirstColumn(); c; c = c.getNext()) {
            if (c === col) {
                c.element.setAttribute("sortDirection", sortDir);
                c.element.setAttribute("sortActive", "true");
            } else {
                c.element.setAttribute("sortDirection", "natural");
                c.element.removeAttribute("sortActive")
            }
        }
        this._sortBy = col.element.id.substring("hBookmarkTagTree_".length);
        this._sortDir = sortDir;

        this._treeBox.rowCountChanged(0, -this.rowCount);
        this._visibleItems.length = 0;
        this._openRelatedTags(this._rootItem);
        this._visibleItems.forEach(function (item, i) item.index = i);
        this._treeBox.rowCountChanged(0, this.rowCount);
    },

    _setSortKey: function TTV__setSortKey() {
        let cols = this._treeBox.columns;
        for (let col = cols.getFirstColumn(); col; col = col.getNext()) {
            let element = col.element;
            if (element.getAttribute("sortActive") === "true") {
                this._sortBy = element.id.substring("hBookmarkTagTree_".length);
                this._sortDir = element.getAttribute("sortDirection");
                break;
            }
        }
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
        let sortDir = this._sortDir;
        if (sortDir && sortDir !== "natural") {
            if (this._sortBy === "count") {
                items.sort((sortDir === "ascending")
                           ? function (a, b) a.count - b.count
                           : function (a, b) b.count - a.count);
            } else if (sortDir === "descending") {
                items.reverse();
            }
        }
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

        case "UserChange":
            this.build();
            break;
        }
    },

    build: function TTV_build() {
        let prevRowCount = this.rowCount;
        this._visibleItems = [];
        this._openRelatedTags(this._rootItem);
        this._visibleItems.forEach(function (item, i) item.index = i);
        this._treeBox.rowCountChanged(0, -prevRowCount);
        this._treeBox.rowCountChanged(0, this.rowCount);
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
