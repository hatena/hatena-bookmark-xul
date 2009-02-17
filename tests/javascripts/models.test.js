
var _global = this;
var hBookmark;

function warmUp() {
    utils.include('btil.js');
    var tempGlobal = loadAutoloader("chrome://hatenabookmark/content/unknown.xul");
    hBookmark = tempGlobal.hBookmark;
    hBookmark.extend(_global, hBookmark);
}

function setUp()
{
    initDatabase(hBookmark);
}

function testParseTags() {
    var B = model('Bookmark');
    assert.equals(B.parseTags('[hoge][huga]mycomment').length, 2);
}

function testBookmark() {
    var BOOKMARK = model('Bookmark');
    var b = new BOOKMARK();
    b.url = 'http://b.hatena.ne.jp/';
    b.comment = '[hoge][huga]mycomment';
    b.title = 'bookmark1';
    b.date = 0;
    b.save();
    assert.equals(b.id, 1);
    assert.isTrue(b.search.length > 0);

    var b2 = BOOKMARK.findById(b.id)[0];
    assert.equals(b.title, b2.title);

    assert.equals(b2.tags.length, 2);
    assert.equals(b2.tags[0], 'hoge');
    assert.equals(b2.tags[1], 'huga');

    assert.isTrue(model('Tag').findByName('hoge').length);

    var res = BOOKMARK.findAll();
    assert.isTrue(res.length > 0);

    var res = BOOKMARK.findByTags('hoge');
    assert.isTrue(res.length == 1);

    b = new BOOKMARK();
    b.url = 'http://b.hatena.ne.jp/2';
    b.comment = '[hoge]mycomment2';
    b.title = 'bookmark2';
    b.date = 0;
    b.save();

    res = BOOKMARK.findByTags('hoge');
    assert.isTrue(res.length == 2);

    res = BOOKMARK.findByTags('hoge', 'huga');
    assert.isTrue(res.length == 1);

}

