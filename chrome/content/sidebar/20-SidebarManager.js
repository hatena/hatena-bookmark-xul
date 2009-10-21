const EXPORT = ["sidebarBundle"];

window.addEventListener("load", initializeSidebar, false);

function initializeSidebar() {
    User.login();

    var tagTree = document.getElementById("tag-tree");
    var tagTreeView = new TagTreeView();
    tagTree.view = tagTreeView;

    let tagContext = document.getElementById("hBookmark-tag-context");
    tagContext._context = new TagContext();

    var bookmarkTree = document.getElementById("bookmark-tree");
    var bookmarkTreeView = new BookmarkTreeView();
    bookmarkTree.view = bookmarkTreeView;

    tagTree.addEventListener("select", tagTreeView, false);
    tagTree.addEventListener("click", tagTreeView, false);
    EventService.createListener("BookmarksUpdated", tagTreeView);
    EventService.createListener("UserChange", tagTreeView);

    let searchbar = document.getElementById("searchbar");

    tagTree.addEventListener("HB_TagsSelected", bookmarkTreeView, false);
    searchbar.addEventListener("input", bookmarkTreeView, false);
    searchbar.addEventListener("HB.SearchModeChanged", bookmarkTreeView, false);
    bookmarkTree.addEventListener("focus", bookmarkTreeView, false);
    bookmarkTree.addEventListener("select", bookmarkTreeView, false);
    bookmarkTree.addEventListener("click", bookmarkTreeView, false);
    bookmarkTree.addEventListener("keypress", bookmarkTreeView, false);
    bookmarkTree.body.addEventListener("mouseover", bookmarkTreeView, false);
    bookmarkTree.body.addEventListener("mousemove", bookmarkTreeView, false);
    EventService.createListener("BookmarksUpdated", bookmarkTreeView);
    EventService.createListener("UserChange", bookmarkTreeView);

    let bookmarkContext = document.getElementById('hBookmark-bookmark-context');
    let bookmarkTreeContext = new BookmarkTreeContext(bookmarkContext);

    setBoxDirection();
    Prefs.bookmark.createListener("sidebar.reverseDirection", setBoxDirection);

    EventService.createListener("UserChange", showSidebarContent);
    showSidebarContent();
    searchbar.focus();

    // 開いた直後はデータを取得できないことがあるので遅延させる。
    setTimeout(function () {
        if (!tagTreeView.rowCount)
            tagTreeView.build();
    }, 500);
}

function showSidebarContent() {
    let isLoggedIn = !!User.user;
    document.getElementById("login-notification").collapsed = isLoggedIn;
    document.getElementById("main-content").collapsed = !isLoggedIn;
    if (isLoggedIn) {
        // ボックスの位置情報が確実に利用できるよう遅延させる。
        setTimeout(function () {
            document.getElementById("bookmark-tree").view.wrappedJSObject.update();
        }, 0);
    }
}

function setBoxDirection() {
    let dir = Prefs.bookmark.get("sidebar.reverseDirection")
              ? "reverse" : "normal";
    document.getElementById("main-content").setAttribute("dir", dir);
}
