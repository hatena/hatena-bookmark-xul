var hBookmark;
var view;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/browser.xul");
    hBookmark = global.hBookmark;
}

function setUp() {
    prepareDatabase(hBookmark);

    view = new hBookmark.AddPanelView();
}

function testNotBookmarked() {
    let window = {
        location: {
            href: "http://example.org/not-bookmarked"
        },
        document: {
            title: "Not Bookmarked Page"
        }
    };
    view.setup(window);
    assert.equals(view.title, window.document.title);
    assert.equals(view.url, window.location.href);
    assert.equals(view.comment, "");
}

function testBookmarked() {
    let window = {
        location: {
            href: "http://example.org/langs"
        },
        document: {
            title: "Already Bookmarked Page"
        }
    };
    view.setup(window);
    assert.equals(view.title, "Multiple languages title");
    assert.equals(view.url, window.location.href);
    assert.equals(view.comment, "[Perl][Ruby][JavaScript] Multiple languages comment");
}
