function TagPanel() {
    this.panel = document.getElementById("main-content");
    this.tagTree = document.getElementById("tag-tree");
    this.tagContext = document.getElementById("hBookmark-tag-context");
    this.bookmarkTree = document.getElementById("bookmark-tree");
    this.searchBox = document.getElementById("searchBox");

    this.tagTreeView = new TagTreeView();
    this.tagContext._context = new TagContext();
    this.bookmarkTreeView = new Bookmarktreeview();

    this.setBoxDirection();

    setTimeout(method(this, "delayedInit"), 0);
}

extend(TagPanel, {
    listeners: [],

    delayedInit: function TP_delayedInit() {
        this.tagTree.addEventListener("HB_TagSelected", this, false);
        this.searchBox.addEventListener("input", this, false);
        this.searchBox.addEventListener("keypress", this, false);
        this.listeners.push(Prefs.bookmark.createListener("sidebar.reverseDirection", method(this, "setBoxDirection")));
        this.searchBox.focus();
    },

    destroy: function TP_destroy() {
        this.tagTree.removeEventListener("HB_TagSelected", this, false);
        this.searchBox.removeEventListener("input", this, false);
        this.searchBox.removeEventListener("keypress", this, false);
        this.listeners.forEach(function (l) l.unlisten());
        this.listeners.length = 0;
    },

    setBoxDirection: function TP_setBoxDirection() {
        let dir = Prefs.bookmark.get("sidebar.reverseDirection")
                  ? "reverse" : "normal";
        this.panel.setAttribute("dir", dir);
    },

    handleEvent: function TP_handleEvent(event) {
        switch (event.type) {
        case "HB_TagsSelected":
            this.bookmarkTreeView.handleEvent(event);
            break;

        case "input":
            this.bookmarkTreeView.handleEvent(event);
            break;
        }
    }
});

Sidebar.TagPanel = TagPanel;
