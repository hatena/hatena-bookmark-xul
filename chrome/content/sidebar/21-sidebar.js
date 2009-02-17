const EXPORT = ["Sidebar"];

window.addEventListener("load", function () {
    hBookmark.sidebar = new Sidebar(document);
}, false);

function Sidebar(doc) {
    this.tagTree = doc.getElementById("tag-tree");
    this.tagTreeView = new TagTreeView();
    this.tagTree.view = this.tagTreeView;

    this.bookmarkTree = doc.getElementById("bookmark-tree");
    this.bookmarkTreeView = new BookmarkTreeView();
    this.bookmarkTree.view = this.bookmarkTreeView;

    this.tagTree.addEventListener("select", this, false);
}

extend(Sidebar.prototype, {
    handleEvent: function (event) {
        switch (event.type) {
        case "select":
            if (event.target === this.tagTree) {
                this.bookmarkTreeView.showByTags(this.tagTreeView.selectedTags);
            }
            break;
        }
    }
});
