var hBookmark;
var view;
var toolbar = {};

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/browser.xul");
    hBookmark = global.hBookmark;
}

function setUp() {
    prepareDatabase(hBookmark);

    view = new hBookmark.ToolbarView();
    view.setToolbar(toolbar);
}

function testToolbarView() {
    assert.equals(view.bookmarkCount, 3);
    assert.isDefined(view.getBookmarkAt(0));
}
