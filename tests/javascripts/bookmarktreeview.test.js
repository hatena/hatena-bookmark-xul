var hBookmark;
var view;
var treeBox = {
    treeBody: {},
    rowCountChanged: function () {},
    invalidateRow: function () {},
    invalidate: function () {},
    getPageLength: function () 10
};

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/sidebar.xul");
    hBookmark = global.hBookmark;
}

function setUp() {
    prepareDatabase(hBookmark);

    view = new hBookmark.BookmarkTreeView();
    view.setTree(treeBox);
}

function testBookmarkTreeView() {
    assert.equals(view.rowCount, 3);

    view.showByTags(["Perl"]);
    assert.equals(view.rowCount, 2);

    view.showBySearchString("js");
    assert.equals(view.rowCount, 1);
}
