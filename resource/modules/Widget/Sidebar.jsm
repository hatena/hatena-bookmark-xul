const EXPORTED_SYMBOLS = ["Sidebar"];

Components.utils.import("resource://hatenabookmark/modules/base.jsm");
require("Widget.TagTreeView");
require("Widget.BookmarkTreeView");

extendBuiltIns(this);

function Sidebar(doc) {
    this.tagTree = doc.getElementById("tag-tree");
    this.tagTree.view = new Widget.TagTreeView();
    this.tagTree.addEventListener("select", this, false);

    this.bookmarkTree = doc.getElementById("bookmark-tree");
    this.bookmarkTree.view = new Widget.BookmarkTreeView();
}

extend(Sidebar.prototype, {
    handleEvent: function (event) {
        switch (event.type) {
        case "select":
            if (event.target === this.tagTree) {
                this.bookmarkTree.view.wrappedJSObject
                    .showByTags(this.tagTree.view.wrappedJSObject.selectedTags);
            }
            break;
        }
    }
});
