var EXPORT = ["TagList"];

const COL_TAG   = "tag-list-col-tag";
const COL_COUNT = "tag-list-col-count";

const TAG_ATOM   = AtomService.getAtom("tag");
const COUNT_ATOM = AtomService.getAtom("count");

function TagList(treeElement) {
    this.tags = [];
    this._originalTags = null;
    this._tree = null;

    treeElement.view = this;
}

TagList.prototype.__proto__ = TreeView.prototype;

extend(TagList.prototype, {
    init: function TL_init() {
        this._originalTags = Model.Tag.findDistinctTags();
        this._sort();
    },

    destroy: function TL_destroy() {
        if (!this._tree) return;
        //p('destroy TagList');
    },

    _sort: function TL__sort() {
        let keyCol = null;
        for (let col = this._tree.columns.getFirstColumn();
             col;
             col = col.getNext()) {
            if (col.element.getAttribute("sortActive") === "true") {
                keyCol = col.element;
                break;
            }
        }
        let tags = this._originalTags;
        let sortDir;
        if (keyCol &&
            (sortDir = keyCol.getAttribute("sortDirection")) !== "natural") {
            tags = tags.concat();
            switch (keyCol.id) {
            case COL_TAG:
                tags.sort(function (a, b)
                              a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
                if (sortDir === "descending")
                    tags.reverse();
                break;

            case COL_COUNT:
                tags.sort((sortDir === "ascending")
                              ? function (a, b) a.count - b.count
                              : function (a, b) b.count - a.count);
                break;
            }
        }
        this.tags = tags;
    },

    get selectedTag() {
        let index = this.selection.currentIndex;
        return this.tags[index] || null;
    },

    get treeBody() this._tree && this._tree.treeBody,

    // nsITreeView

    get rowCount() this.tags.length,

    getCellText: function TL_getCellText(row, col) {
        switch (col.id) {
        case COL_TAG:   return this.tags[row].name;
        case COL_COUNT: return this.tags[row].count;
        }
        return "";
    },

    setTree: function TL_setTree(tree) {
        if (tree) {
            this._tree = tree;
            this.init();
        } else {
            this.destroy();
            this._tree = null;
        }
    },

    getCellProperties: function TL_getCellProperties(row, col, properties) {
        if (!properties) { // since Gecko 22
            return (col.id === COL_TAG ? "tag" : "count");
        } else {
            properties.AppendElement((col.id === COL_TAG) ? TAG_ATOM : COUNT_ATOM);
        }
    },

    cycleHeader: function TL_cycleHeader(col) {
        let sortDir = col.element.getAttribute("sortDirection");
        sortDir = (sortDir === "ascending")  ? "descending" :
                  (sortDir === "descending") ? "natural"    : "ascending";
        for (let c = col.columns.getFirstColumn(); c; c = c.getNext()) {
            let isKey = (c === col);
            c.element.setAttribute("sortDirection", isKey ? sortDir : "natural");
            c.element.setAttribute("sortActive", isKey);
        }
        this._sort();
        this._tree.invalidate();
    }
});
