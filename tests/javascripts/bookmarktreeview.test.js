var global = {
    __proto__: window,
    location: {
        href: "chrome://hatenabookmark/content/sidebar.xul",
        pathname: "/content/sidebar.xul"
    }
};
var hBookmark;
var view;
var treeBox = {
    rowCountChanged: function () {},
    invalidateRow: function () {},
    invalidate: function () {}
};

function setUp() {
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader)
        .loadSubScript("chrome://hatenabookmark/content/autoloader.js", global);
    hBookmark = global.hBookmark;

    var db = new hBookmark.Database("hatena.bookmark.test.sqlite");
    hBookmark.Model.db = db;
    hBookmark.Model.resetAll();

    var Tag = hBookmark.model("Tag");
    [
        [1, "Perl"], [1, "Ruby"], [1, "JavaScript"],
        [2, "Perl"], [2, "Ruby"],
        [3, "Ruby"], [3, "JavaScript"],
    ].forEach(function ([bmId, name]) {
        var tag = new Tag();
        tag.bookmark_id = bmId;
        tag.name = name;
        tag.save();
    });
    var Bookmark = hBookmark.model("Bookmark");
    [
        ["http://example.org/langs",
         "[Perl][Ruby][JavaScript]Multiple languages comment",
         "Multiple languages title"],
        ["http://example.org/perl-ruby",
         "[Perl][Ruby]Perl and Ruby comment",
         "Perl and Ruby title"],
        ["http://example.org/ruby-js",
         "[Ruby][JavaScript]Ruby and JS comment",
         "Ruby and JS title"],
    ].forEach(function ([url, comment, title]) {
        var b = new Bookmark();
        [b.url, b.comment, b.title, b.date] = [url, comment, title, 0];
        b.save();
    });

    view = new hBookmark.BookmarkTreeView();
    view.setTree(treeBox);
}

function testBookmarkTreeView() {
    assert.equals(view.rowCount, 0);

    view.showByTags(["Perl"]);
    assert.equals(view.rowCount, 2);
}
