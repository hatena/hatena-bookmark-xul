var hBookmark;
var view;
var treeBox = {
    rowCountChanged: function () {},
    invalidateRow: function () {},
    invalidate: function () {}
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
    assert.equals(view.rowCount, 0);

    view.showByTags(["Perl"]);
    assert.equals(view.rowCount, 2);
}
