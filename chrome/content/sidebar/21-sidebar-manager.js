window.addEventListener("load", initializeSidebar, false);

function initializeSidebar() {
    var tagTree = document.getElementById("tag-tree");
    var tagTreeView = new TagTreeView();
    tagTree.view = tagTreeView;

    var bookmarkTree = document.getElementById("bookmark-tree");
    var bookmarkTreeView = new BookmarkTreeView();
    bookmarkTree.view = bookmarkTreeView;

    tagTree.addEventListener("select", bookmarkTreeView, false);
    tagTree.addEventListener("click", tagTreeView, false);
}
