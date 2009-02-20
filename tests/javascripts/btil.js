
// テストヘルパ

var globalLoaderPath = '../../chrome/content/GlobalLoader.js';
var load = function(bundle) {
    var context = {};
    utils.include(globalLoaderPath, context);
    context.GlobalLoader.loadAll(bundle);

    // db init
    var db = new bundle.Database('hatena.bookmark.test.sqlite');
    bundle.hBookmark.Model.db = db;
    bundle.hBookmark.Model.resetAll();
}

function loadAutoloader(uri) {
    var global = {
        __proto__: window,
        location: {
            href: uri,
            pathname: uri.replace(/^[\w-]+:\/\/[\w.:-]+/, "")
        }
    };
    // utils.includeだとIndirect Eval Callエラーになる?
    //utils.include("chrome://hatenabookmark/content/autoloader.js", global);
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader)
        .loadSubScript("chrome://hatenabookmark/content/autoloader.js", global);
    return global;
}

function initDatabase(hBookmark) {
    var db = new hBookmark.Database("hatena.bookmark.test.sqlite");
    hBookmark.Model.db = db;
    hBookmark.Model.resetAll();
}

function prepareDatabase(hBookmark) {
    initDatabase(hBookmark);

    var Bookmark = hBookmark.model("Bookmark");
    [
        ["http://example.org/langs",
         "[Perl][Ruby][JavaScript] Multiple languages comment",
         "Multiple languages title"],
        ["http://example.org/perl-ruby",
         "[Perl][Ruby] Perl and Ruby comment",
         "Perl and Ruby title"],
        ["http://example.org/ruby-js",
         "[Ruby][JavaScript] Ruby and JS comment",
         "Ruby and JS title"],
    ].forEach(function ([url, comment, title]) {
        var b = new Bookmark();
        [b.url, b.comment, b.title, b.date] = [url, comment, title, 0];
        b.save();
    });
}
