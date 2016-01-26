var hBookmark = null;

function warmUp() {
    utils.include("btil.js");
    let global = loadAutoloader("chrome://hatenabookmark/content/sidebar.xul");
    hBookmark = global.hBookmark;
}

var lastOpenedURI = "";
function openUILinkIn(uri, where) {
    lastOpenedURI = uri;
}

function buildTagContext(tagContext, tags) {
    let originalPopupNode = document.popupNode;
    let popupNode = document.createElement('element');
    popupNode.tags = tags;
    document.popupNode = popupNode;
    let result = tagContext.build(null);
    document.popupNode = originalPopupNode;
    return result;
}

// TagContext側でdocument.popupNodeを参照すると
// セキュリティエラーになってしまう……。
testOpenIn.priority = 'never';
function testOpenIn() {
    let ctx = new hBookmark.TagContext();
    let result = buildTagContext(ctx, ["日本語", "tag"]);
    assert.isTrue(result);
    ctx.openIn('current');
    assert.equals('http://b.hatena.ne.jp/' + hBookmark.User.user.name +
                  '/%E6%97%A5%E6%9C%AC%E8%AA%9E/tag',
                  lastOpenedURI);
}
