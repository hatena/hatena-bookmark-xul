const EXPORT = ["TagList"];

function TagList(treeElement) {
    this.tags = [];
    this._tree = null;

    treeElement.view = this;
}

TagList.prototype.__proto__ = TreeView.prototype;

extend(TagList.prototype, {
    init: function TL_init() {
        this.tags = Model.Tag.findDistinctTags();
    },

    destroy: function TL_destroy() {
        if (!this._tree) return;
        p('destroy TagList');
    },

    _setSortMethod: function TL__setSortMethod() {
        let keyCol = null;
        for (let col = this._tree.columns.getFirstColumn();
             col;
             col = col.getNext()) {
            if (col.element.getAttribute("sortActive") === "true") {
                keyCol = col.element;
                break;
            }
        }
    },

    // nsITreeView

    get rowCount TL_get_rowCount() this.tags.length,

    getCellText: function TL_getCellText(row, col) {
        switch (col.id) {
        case "tag-list-col-tag":   return this.tags[row].name;
        case "tag-list-col-count": return this.tags[row].count;
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
    }
});
