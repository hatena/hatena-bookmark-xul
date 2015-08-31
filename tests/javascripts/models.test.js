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
    assert.equals(B.parseTags('[hoge][huga]mycomment[foo]').length, 2);
}

function bookmarkFixture() {
    var BOOKMARK = model('Bookmark');
    for (var i = 0;  i < 10; i++) {
        let b = new BOOKMARK();
        b.url = 'http://b.hatena.ne.jp/url' + i;
        b.comment = '[tag1][tag2]b.hatena comment' + i;
        b.title = 'b.hatena title' + i;
        b.date = 0;
        b.save();
    }
}

function testBookmarkSearch() {
    bookmarkFixture();
    var BOOKMARK = model('Bookmark');

    var res;
    res = BOOKMARK.search('/url');
    assert.equals(res.length, 10);
    assert.equals(res[0].title, 'b.hatena title' + 9); // desc なので

    res = BOOKMARK.search('/url', 100);
    assert.equals(res.length, 10);

    res = BOOKMARK.search('/url', 5);
    assert.equals(res.length, 5);

    res = BOOKMARK.search('nohitdayo');
    assert.equals(res.length, 0);

    res = BOOKMARK.search('tag1 tag2 comment2');
    assert.equals(res.length, 1);

    res = BOOKMARK.search('/url', 1, true);
    assert.equals(res[0].title, 'b.hatena title' + 0); // asc

    res = BOOKMARK.search('/url', 1, true, 5);
    assert.equals(res[0].title, 'b.hatena title' + 5);
}

function testSearchAny() {
    bookmarkFixture();
    var BOOKMARK = model('Bookmark');
    var res;

    res = BOOKMARK.searchByTitle('url', 10);
    assert.equals(res.length, 0);

    res = BOOKMARK.searchByTitle('title', 10);
    assert.equals(res.length, 10);

    res = BOOKMARK.searchByUrl('url', 10);
    assert.equals(res.length, 10);

    res = BOOKMARK.searchByUrl('title', 10);
    assert.equals(res.length, 0);

    res = BOOKMARK.searchByComment('tag1', 10);
    assert.equals(res.length, 10);

    res = BOOKMARK.searchByComment('title', 10);
    assert.equals(res.length, 0);

    res = BOOKMARK.searchByComment('comment_', 10);
    assert.equals(res.length, 0);
}

function testSearchMultibyte() {
    var BOOKMARK = model('Bookmark');
    var res;

    var b = new BOOKMARK();
    b.url = 'http://b.hatena.ne.jp/url';
    b.comment = '[tag1][tag2][タグ]コメントb.hatena comment';
    b.title = 'タイトルb.hatena title';
    b.date = 0;
    b.save();
    res = BOOKMARK.searchByComment('コメント', 10);
    assert.equals(res.length, 1);

    b = new BOOKMARK();
    b.url = 'http://b.hatena.ne.jp/url2';
    b.comment = 'コメントb.hatena comment';
    b.title = 'タイトルb.hatena title';
    b.date = 0;
    b.save();
    res = BOOKMARK.searchByComment('コメント', 10);
    assert.equals(res.length, 2);
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

    assert.equals(b2.body, 'mycomment');
    assert.equals(b2.tags.length, 2);
    assert.equals(b2.tags[0], 'hoge');
    assert.equals(b2.tags[1], 'huga');

    assert.isTrue(model('Tag').findByName('hoge').length);

    var res = BOOKMARK.findAll();
    assert.isTrue(res.length > 0);

    var res = BOOKMARK.findByTags(['hoge']);
    assert.isTrue(res.length == 1);

    b = new BOOKMARK();
    b.url = 'http://b.hatena.ne.jp/2';
    b.comment = '[hoge]mycomment2';
    b.title = 'bookmark2';
    b.date = 20090401123456;
    b.save();

    var b3 = BOOKMARK.searchByUrl(b.url);
    assert.equals(b.comment, b3[0].comment);
    assert.equals('2009/04/01', b3[0].dateYMD);
    assert.equals('2009-04-01 12:34:56',
                  b3[0].dateObject.toLocaleFormat('%Y-%m-%d %H:%M:%S'))

    res = BOOKMARK.findByTags('hoge');
    assert.isTrue(res.length == 2);

    res = BOOKMARK.findByTags(['hoge', 'huga']);
    assert.isTrue(res.length == 1);

    res = BOOKMARK.findRecent(1);
    assert.isTrue(res.length == 1);

    assert.equals(1, model('Tag').findByName('huga').length);
    BOOKMARK.deleteBookmarks([b2]);
    assert.equals(0, model('Tag').findByName('huga').length);

}

function testTag() {
    let Tag = model("Tag");
    prepareDatabase(hBookmark);

    let names;
    names = Tag.findDistinctTags().map(function (t) t.name);
    assert.equals(names.sort(), ["JavaScript", "Perl", "Ruby"]);
    names = Tag.findRelatedTags(["Perl", "Ruby"]).map(function (t) t.name);
    assert.equals(names.sort(), ["JavaScript"]);

    let tags;
    Tag.rename("JavaScript", "JS");
    tags = Tag.findByName("JS");
    assert.equals(tags.length, 2);
    Tag.deleteByName("Perl");
    tags = Tag.findByName("Perl");
    assert.equals(tags.length, 0);
}


