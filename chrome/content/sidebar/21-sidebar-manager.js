window.addEventListener("load", initializeSidebar, false);

function initializeSidebar() {
    var tagTree = document.getElementById("tag-tree");
    var tagTreeView = new TagTreeView();
    tagTree.view = tagTreeView;

    var tagTreeMenu = document.getElementById(tagTree.contextMenu);
    var tagTreeMenuCommand = new TagTreeMenuCommand(tagTreeView);

    var bookmarkTree = document.getElementById("bookmark-tree");
    var bookmarkTreeView = new BookmarkTreeView();
    bookmarkTree.view = bookmarkTreeView;

    tagTree.addEventListener("select", bookmarkTreeView, false);
    tagTree.addEventListener("click", tagTreeView, false);
    tagTreeMenu.addEventListener("popupshowing", tagTreeMenuCommand, false);
    tagTreeMenu.addEventListener("command", tagTreeMenuCommand, false);
    bookmarkTree.addEventListener("click", bookmarkTreeView, false);
}
