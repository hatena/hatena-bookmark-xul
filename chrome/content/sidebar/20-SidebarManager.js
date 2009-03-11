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

    var tagTreeMenu = document.getElementById(tagTree.contextMenu);
    var tagTreeCommand = new TagTreeCommand(tagTreeView);

    var bookmarkTree = document.getElementById("bookmark-tree");
    var bookmarkTreeView = new BookmarkTreeView();
    bookmarkTree.view = bookmarkTreeView;

    tagTree.addEventListener("click", tagTreeView, false);

    tagTreeMenu.addEventListener("popupshowing", tagTreeCommand, false);
    tagTreeMenu.addEventListener("command", tagTreeCommand, false);

    tagTree.addEventListener("select", bookmarkTreeView, false);
    bookmarkTree.addEventListener("click", bookmarkTreeView, false);
}
