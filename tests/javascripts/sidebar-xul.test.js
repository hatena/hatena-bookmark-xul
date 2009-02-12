
var _global = this;

var doc;
var win;

function warmUp() {
    var helper = { utils: utils };
    utils.include('btil.js', helper);
    helper.load(_global);

    var browserWin = utils.openTestWindow();
    yield 700;
    // アラートをはさまないとオーバーレイが
    // 適用される前に次の処理に移ってしまう。
    // アラートをはさんでもタイミングによってはうまくいかない。なぜ?
    browserWin.alert('Are you ready?');
    browserWin.toggleSidebar("viewHBookmarkSidebar", true);
    yield 300;
    doc = browserWin.document.getElementById("sidebar").contentDocument;
    win = doc.defaultView;
}

function coolDown() {
    utils.closeTestWindow();
}

function testId() {
    assert.equals(doc.documentElement.id, "hBookmarkSidebar");
}
