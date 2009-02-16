var global = this;

var moduleRoot;
var BookmarkTreeView;
var view;
var treeBox = {
    rowCountChanged: function () {},
    invalidateRow: function () {},
    invalidate: function () {}
};

function warmUp() {
    moduleRoot = Components.utils.import("resource://hatenabookmark/modules/base.jsm", {});
    moduleRoot.require("ModelTemp");
    BookmarkTreeView = moduleRoot.require("Widget.BookmarkTreeView");
}

function setUp() {
    var helper = { utils: utils };
    utils.include('btil.js', helper);
    helper.load(global);

    var Tag = model("Tag");
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
    var Bookmark = model("Bookmark");
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

    moduleRoot.hBookmark.Model.db = hBookmark.Model.db;

    view = new BookmarkTreeView();
    view.setTree(treeBox);
}

function testBookmarkTreeView() {
    assert.equals(view.rowCount, 0);

    view.showByTags(["Perl"]);
    assert.equals(view.rowCount, 2);
}
