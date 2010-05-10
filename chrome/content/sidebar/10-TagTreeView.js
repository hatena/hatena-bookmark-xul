const EXPORT = ["TagTreeView"];

const NAME_ATOM  = AtomService.getAtom("Name");
const TITLE_ATOM = AtomService.getAtom("title");
const TAG_ATOM   = AtomService.getAtom("tag");
const COUNT_ATOM = AtomService.getAtom("count");

const RDFService = getService("@mozilla.org/rdf/rdf-service;1", Ci.nsIRDFService);
const LocalStore = RDFService.GetDataSource("rdf:local-store");
const OPEN = RDFService.GetResource("http://home.netscape.com/NC-rdf#open");
const TRUE = RDFService.GetLiteral("true");

var Tag = model("Tag");


function TagTreeItem(tag, parentItem) {
    this.currentTag = tag && tag.name;
    this.count = tag && tag.count;
    this.parent = parentItem;
    this.index = -1;
    this.tags = parentItem ? parentItem.tags.concat(tag.name) : [];
    this.uri = parentItem
        ? parentItem.uri + "[" + encodeURI(tag.name.toLowerCase()) + "]"
        : location.href + "#tag-tree-";
    this.level = parentItem ? parentItem.level + 1 : -1;
    this.hasNext = true;
    this.isOpen = false;
    this.isEmpty = null;
    this.ignoreSelect = false;
}

extend(TagTreeItem.prototype, {
    get shouldBeOpen() {
        let resource = RDFService.GetResource(this.uri);
        return !!resource &&
               LocalStore.HasAssertion(resource, OPEN, TRUE, true);
    },

    set shouldBeOpen(open) {
        let resource = RDFService.GetResource(this.uri);
        if (resource) {
            if (open)
                LocalStore.Assert(resource, OPEN, TRUE, true);
            else
                LocalStore.Unassert(resource, OPEN, TRUE);
        }
        return open;
    }
});


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
        let treeChildren = this._treeBox.treeBody;
        treeChildren.tags = [];
        this._setSortKey();
        this._openRelatedTags(this._rootItem, this._visibleItems);
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
        //if ($count === 0) $start = new Date();
        if (item.isEmpty === null)
            item.isEmpty = !Tag.hasRelatedTags(item.tags);
        //if (++$count === $maxCount)
        //    p("Benchmark isContainerEmpty: " + (new Date() - $start));
        return item.isEmpty;
    },

    getCellProperties: function (row, col, properties) {
        switch (col.id) {
        case "hBookmarkTagTree_currentTag":
            // デフォルトのフォルダアイコンではなく独自のアイコンを使うのなら
            // 次の二つのアトムを追加する必要はない。
            properties.AppendElement(NAME_ATOM);
            properties.AppendElement(TITLE_ATOM);
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
            let isKey = (c === col);
            c.element.setAttribute("sortDirection", isKey ? sortDir : "natural");
            c.element.setAttribute("sortActive", isKey);
        }
        this._sortBy = col.element.id.substring("hBookmarkTagTree_".length);
        this._sortDir = sortDir;

        this._treeBox.rowCountChanged(0, -this.rowCount);
        this._visibleItems.length = 0;
        this._openRelatedTags(this._rootItem, this._visibleItems);
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
            ? this._closeRelatedTags(item, visibleItems)
            : this._openRelatedTags(item, visibleItems);
        if (changedCount) {
            item.isOpen = !item.isOpen;
            for (var i = index + 1; i < visibleItems.length; i++)
                visibleItems[i].index = i;
            this._treeBox.rowCountChanged(index + 1, changedCount);
        } else {
            item.isOpen = false;
            item.isEmpty = true;
        }
        item.shouldBeOpen = item.isOpen;
        this._treeBox.invalidateRow(index);
    },

    _openRelatedTags: function (parentItem, parentItems) {
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
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (item.shouldBeOpen) {
                item.index = i;
                let insertedCount = this._openRelatedTags(item, items);
                item.isOpen = !!insertedCount;
                item.isEmpty = !insertedCount;
                i += insertedCount;
            }
        }
        var spliceArgs = [parentItem.index + 1, 0].concat(items);
        parentItems.splice.apply(parentItems, spliceArgs);
        return items.length;
    },

    _closeRelatedTags: function (parentItem, parentItems) {
        var startIndex = parentItem.index + 1;
        var endIndex = startIndex;
        var currentLevel = parentItem.level;
        while (endIndex < parentItems.length &&
               parentItems[endIndex].level > currentLevel)
            endIndex++;
        parentItems.splice(startIndex, endIndex - startIndex);
        return startIndex - endIndex;
    },

    get selectedTags () {
        var index = this.selection.currentIndex;
        return (index === -1) ? [] : this._visibleItems[index].tags.concat();
    },

    handleEvent: function TTV_handleEvent(event) {
        switch (event.type) {
        case "select":
            if (this.ignoreSelect) break;
            this.setTags();
            break;

        case "click":
            this.handleClick(event);
            break;

        case "UserChange":
            if (User.user) this.build();
            break;

        case "BookmarksUpdated":
            this.refresh();
            break;
        }
    },

    build: function TTV_build() {
        let prevRowCount = this.rowCount;
        this._visibleItems = [];
        this._openRelatedTags(this._rootItem, this._visibleItems);
        this._visibleItems.forEach(function (item, i) item.index = i);
        this._treeBox.rowCountChanged(0, -prevRowCount);
        this._treeBox.rowCountChanged(0, this.rowCount);
    },

    refresh: function () {
        let selectedRow = this.selection.currentIndex;
        let visibleRow = this._treeBox.getFirstVisibleRow();
        this.build();
        let rowCount = this.rowCount;
        if (rowCount) {
            let maxScrollRow = Math.max(rowCount - this._treeBox.getPageLength(), 0);
            this._treeBox.scrollToRow(Math.min(visibleRow, maxScrollRow));
            this.ignoreSelect = true;
            this.selection.select(Math.min(selectedRow, rowCount - 1));
            this.ignoreSelect = false;
        }
    },

    setTags: function TTV_setTags() {
        let treeChildren = this._treeBox.treeBody;
        let index = this.selection.currentIndex;
        if (index === -1) {
            treeChildren.tags = [];
        } else {
            treeChildren.tags = this._visibleItems[index].tags.concat();
            let event = document.createEvent("Event");
            event.initEvent("HB_TagsSelected", true, false);
            treeChildren.dispatchEvent(event);
        }
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
