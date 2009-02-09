
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

