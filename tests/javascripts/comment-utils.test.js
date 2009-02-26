var hBookmark;

function warmUp() {
    let load = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
        getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript;
    let env = { hBookmark: { autoload: false } };
    load("chrome://hatenabookmark/content/autoloader.js", env);
    hBookmark = env.hBookmark;
    hBookmark.loadModules();
    hBookmark.load("chrome://hatenabookmark/content/browser/10-CommentUtils.js");
}

function testSplitComment() {
    let u = hBookmark.CommentUtils;
    assert.equals(u.splitComment("[", 1), ["[", "", ""]);
    assert.equals(u.splitComment("[a", 2), ["", "a", ""]);
    assert.equals(u.splitComment("[a]", 3), ["[a]", "", ""]);
    assert.equals(u.splitComment("[a][", 4), ["[a][", "", ""]);
    assert.equals(u.splitComment("[a][b", 5), ["[a]", "b", ""]);
    assert.equals(u.splitComment("[a]b[c", 6), ["[a]b[c", "", ""]);

    assert.equals(u.splitComment("[a][bc", 3), ["[a]", "", "[bc"]);
    assert.equals(u.splitComment("[a][bc", 4), ["[a][", "", "bc"]);
    assert.equals(u.splitComment("[a][bc", 5), ["[a]", "b", "c"]);
    assert.equals(u.splitComment("[a][b]c", 4), ["[a]", "b", "c"]);
}
