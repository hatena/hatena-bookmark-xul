let BookmarkService;
let HistoryService;
let tempRoot;

function warmUp() {
    BookmarkService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].
                      getService(Ci.nsINavBookmarksService);
    HistoryService = Cc["@mozilla.org/browser/nav-history-service;1"].
                     getService(Ci.nsINavHistoryService);
    tempRoot = BookmarkService.createFolder(BookmarkService.placesRoot,
                                            "temporary root",
                                            BookmarkService.DEFAULT_INDEX);
}

function coolDown() {
    BookmarkService.removeItem(tempRoot);
}

function testGetService() {
    let dcService;
    try {
        dcService = Cc["@hatena.ne.jp/bookmark/dynamic-container;1"].
                    getService(Ci.nsIDynamicContainer);
    } catch (ex) {}
    assert.isDefined(dcService);
}

function testDynamicContainer() {
    let dc = BookmarkService.createDynamicContainer(
        tempRoot,
        "Hatena Bookmark Dynamic Container",
        "@hatena.ne.jp/bookmark/dynamic-container;1",
        BookmarkService.DEFAULT_INDEX);
    assert.isTrue(dc > 0);

    let query = HistoryService.getNewQuery();
    query.setFolders([dc], 1);
    let options = HistoryService.getNewQueryOptions();
    let result = HistoryService.executeQuery(query, options);
    let root = result.root;
    root.containerOpen = true;
    assert.equals(root.childCount, 10);

    BookmarkService.removeItem(dc);
}
