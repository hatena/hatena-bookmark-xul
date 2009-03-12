const EXPORT = ["sidebarBundle"];

/*
__defineGetter__("sidebarBundle", function get_sidebarBundle() {
    var object = this;
    while (object && !object.hasOwnProperty("sidebarBundle"))
        object = object.__proto__;
    if (!object)
        throw new TypeError("The property sidebarBundle doesn't exist");
    delete object.sidebarBundle;
    return object.sidebarBundle = document.getElementById("sidebar-bundle");
});
*/

window.addEventListener("load", initializeSidebar, false);

function initializeSidebar() {
    var tagTree = document.getElementById("tag-tree");
    var tagTreeView = new TagTreeView();
    tagTree.view = tagTreeView;

    let tagContext = document.getElementById("hBookmarkTagContext");
    tagContext._context = new TagContext();

    var bookmarkTree = document.getElementById("bookmark-tree");
    var bookmarkTreeView = new BookmarkTreeView();
    bookmarkTree.view = bookmarkTreeView;

    tagTree.addEventListener("select", tagTreeView, false);
    tagTree.addEventListener("click", tagTreeView, false);

    tagTree.addEventListener("HB_TagsSelected", bookmarkTreeView, false);
    let searchBox = document.getElementById("searchBox");
    searchBox.addEventListener("input", bookmarkTreeView, false);
    bookmarkTree.addEventListener("select", bookmarkTreeView, false);
    bookmarkTree.addEventListener("click", bookmarkTreeView, false);
    bookmarkTree.addEventListener("keypress", bookmarkTreeView, false);
}
