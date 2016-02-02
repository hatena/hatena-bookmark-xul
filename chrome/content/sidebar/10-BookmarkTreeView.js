var EXPORT = ["BookmarkTreeView"];

var Bookmark = model("Bookmark");

function BookmarkTreeView() {
    this.selection = null;
    this._items = [];
    this._treeBox = null;
    this._update = null;
    this._isAscending = null;
}

BookmarkTreeView.prototype.__proto__ = TreeView.prototype;
extend(BookmarkTreeView.prototype, {
    get rowCount () this._items.length,
    getCellText: function (row, col) this._items[row].title,
    setTree: function (treeBox) {
        this._treeBox = treeBox;
        if (!treeBox) return;
        let col = this._treeBox.columns.getFirstColumn().element;
        this.isAscending = (col.getAttribute("sortDirection") === "ascending");
        this.showBySearchString("");
    },

    getImageSrc: function BTV_getImageSrc(row, col) {
        return this._items[row].faviconUriStr;
    },

    cycleHeader: function BTV_cycleHeader(col) {
        let sortDir = col.element.getAttribute("sortDirection");
        sortDir = (sortDir === "ascending")  ? "descending" : "ascending";
        col.element.setAttribute("sortDirection", sortDir);
        this.isAscending = (sortDir === "ascending");
        this._update();
    },

    get isAscending() this._isAscending,
    set isAscending(value) {
        let v = !!value;
        if (this._isAscending !== v) {
            this._isAscending = v;
            let event = document.createEvent('UIEvent');
            event.initUIEvent('HB.TreeDirectionChanged', true, false, window,
                              v ? TreeView.SORT_ASCENDING : TreeView.SORT_DESCENDING);
            this._treeBox.treeBody.parentNode.dispatchEvent(event);
        }
        return value;
    },

    showByTags: function (tags) {
        this._update = function BTV_doUpdateByTags(callback) {
            let bookmarks = Bookmark.findByTags(tags);
            if (this.isAscending) bookmarks.reverse();
            this.setBookmarksAsync(bookmarks, callback);
        };
        this._update();
    },

    showBySearchString: function BTV_showBySearchString(string, mode) {
        //p('Search "' + string + '" for ' + mode);
        let searchMethod = 'search';
        switch (mode) {
        case 'title':   searchMethod = 'searchByTitle';   break;
        case 'comment': searchMethod = 'searchByComment'; break;
        case 'url':     searchMethod = 'searchByUrl';     break;
        }
        this._update = function BTV_doUpdateBySearchString(callback) {
            let visibleRowCount = this._treeBox.getPageLength();
            let bookmarks = string
                ? Bookmark[searchMethod](string, visibleRowCount, this.isAscending)
                : Bookmark.find({
                    order: this.isAscending ? "date ASC" : "date DESC",
                    limit: visibleRowCount
                });
            this.setBookmarksAsync(bookmarks, callback);
        };
        this._update();
    },

    setBookmarksAsync: function BTV_setBookmarks(bookmarks, callback) {
        var that = this;
        function setBookmarks() {
            let prevRowCount = that.rowCount;
            that._items = bookmarks;
            that._treeBox.treeBody.bookmarks = bookmarks;
            that._treeBox.rowCountChanged(0, -prevRowCount);
            that._treeBox.rowCountChanged(0, that.rowCount);
            if (callback) callback();
        }

        let count = 0;
        function notify() {
            if (bookmarks.length === count) setBookmarks();
            count++;
        }
        notify(); // 結果が 0 件の場合もちゃんと callback が呼ばれるように
        bookmarks.forEach(function (b, idx) {
            b.getFaviconAsync(function (faviconUriStr) {
                bookmarks[idx].faviconUriStr = faviconUriStr || FaviconService.defaultFavicon.spec;
                notify();
            });
        });
    },

    setSelectedBookmark: function BTV_setSelectedBookmark() {
        let row = this.selection.currentIndex;
        let bookmark = this._items[row] || null;
        this._treeBox.treeBody.bookmark = bookmark;
    },

    handleEvent: function (event) {
        switch (event.type) {
        case "HB_TagsSelected":
            let tags = event.originalTarget.tags;
            if (tags)
                this.showByTags(tags);
            break;

        case "BookmarksUpdated":
            this.update();
            break;

        case "UserChange":
            if (User.user) this.showBySearchString("");
            break;

        case "HB.SearchModeChanged":
            if (!event.target.value) break;
            /* FALL THROUGH */
        case "input":
            let mode = event.target.searchMode || null;
            this.showBySearchString(event.target.value, mode);
            break;

        case "focus":
        case "select":
            this.setSelectedBookmark();
            break;

        case "mouseover": this.handleMouseOver(event); break;
        case "mousemove": this.handleMouseMove(event); break;
        case "click":     this.handleClick(event);     break;
        case "keypress":  this.handleKeyPress(event);  break;
        }
    },

    update: function BTV_update() {
        if (!this._update) return;
        let row = this._treeBox.getFirstVisibleRow();
        var that = this;
        this._update(function onComplete() {
            that._treeBox.scrollToRow(row);
        });
    },

    handleMouseOver: function BTV_handleMouseOver(event) {
        document.tooltipNode = event.target;
    },

    handleMouseMove: function BTV_handleMouseMove(event) {
        this._treeBox.treeBody.hoveredBookmark =
            this._getBookmarkAtCurosr(event);
    },

    handleClick: function BTV_handleClick(event) {
        let bookmark = this._getBookmarkAtCurosr(event);
        if ((event.button === 0 || event.button === 1) && bookmark)
            hOpenUILink(bookmark.url, event);
    },

    _getBookmarkAtCurosr: function BTV__getBookmarkAtCurosr(event) {
        let row = {};
        this._treeBox.getCellAt(event.clientX, event.clientY, row, {}, {});
        return this._items[row.value] || null;
    },

    handleKeyPress: function BTV_handleKeyPress(event) {
        let row = this.selection.currentIndex;
        if (event.keyCode !== KeyEvent.DOM_VK_RETURN || row === -1) return;
        let bookmark = this._items[row];
        hOpenUILink(bookmark.url, event);
    }
});
