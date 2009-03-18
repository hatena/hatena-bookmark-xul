
var _global = this;
var hBookmark;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/browser.xul");
    hBookmark = global.hBookmark;
    hBookmark.extend(_global, hBookmark);
}

function setUp() {
}

function tearDown() {
}

const TestTags = [
   '*これはほげ',
   'aaa',
   'abc',
   'array',
   'arrya',
   'as3',
];

function testUniqTag()
{
    let line = new TagCompleter.InputLine('[foo][bar][foo]hoge', TestTags);
    assert.equals(line.value, '[foo][bar][foo]hoge');
    line.uniqTextTags();
    assert.equals(line.value, '[foo][bar]hoge');
}

function testAddTag()
{
    let line = new TagCompleter.InputLine('', TestTags);
    line.addTag('foo');
    assert.equals(line.value, '[foo]');
    line.addTag('foo');
    assert.equals(line.value, '[foo]');
    line.addTag('bar');
    assert.equals(line.value, '[foo][bar]');
}

function testAddTag2()
{
    let line = new TagCompleter.InputLine('コメント', TestTags);
    line.addTag('foo');
    assert.equals(line.value, '[foo]コメント');
    line.addTag('foo');
    assert.equals(line.value, '[foo]コメント');
    line.addTag('bar');
    assert.equals(line.value, '[foo][bar]コメント');
}


function testAddTag3()
{
    let line = new TagCompleter.InputLine('[foo][aaコメント', TestTags);
    line.addTag('foo');
    assert.equals(line.value, '[foo][aaコメント');
    line.addTag('foo');
    assert.equals(line.value, '[foo][aaコメント');
    line.addTag('bar');
    assert.equals(line.value, '[foo][bar][aaコメント');
}

function testDeleteTag() {
    let line = new TagCompleter.InputLine('[foo][aaコメント', TestTags);
    line.deleteTag('foo');
    assert.equals(line.value, '[aaコメント');
    line.deleteTag('foo');
    assert.equals(line.value, '[aaコメント');

    line = new TagCompleter.InputLine('[foo][bar][aaコメント', TestTags);
    line.deleteTag('foo');
    assert.equals(line.value, '[bar][aaコメント');
    line.deleteTag('bar');
    assert.equals(line.value, '[aaコメント');
}

function testPosWord () {
    let line = new TagCompleter.InputLine('[foo][bar]moo', TestTags);
    assert.equals(line.posWord(0), null);
    assert.equals(line.posWord(1), "");
    assert.equals(line.posWord(2), 'f');
    assert.equals(line.posWord(3), 'fo');
    assert.equals(line.posWord(4), 'foo');
    assert.equals(line.posWord(5), null);
    assert.equals(line.posWord(6), "");
    assert.equals(line.posWord(7), 'b');
    assert.equals(line.posWord(8), 'ba');
    assert.equals(line.posWord(9), 'bar');
    assert.equals(line.posWord(10), null);

    assert.equals(line.posWord(11), null);
}

function testSuggest() {
    let line = new TagCompleter.InputLine('[a', TestTags);
    let tags = line.suggest(2); // caret pos, デフォルトだと 10 個
    assert.equals(tags, ['aaa', 'abc', 'array', 'arrya', 'as3']);
    tags = line.suggest(1);
    assert.equals(tags, TestTags);

    line.maxSuggest = 2;
    tags = line.suggest(2);
    assert.equals(tags, ['aaa', 'abc']);

    line = new TagCompleter.InputLine('[ano][bar]', TestTags);
    assert.equals(line.suggest(0), []);
    assert.equals(line.suggest(3), []);
    assert.equals(line.suggest(4), []);
    assert.equals(line.suggest(5), []);
}

function testInsertion() {
    let line = new TagCompleter.InputLine('[a', TestTags);
    // 戻り値に、caret 位置を返す
    assert.equals(5, line.insertionTag('abc', 2));
    assert.equals(line.suggest(5), []);
    assert.equals(line.value, '[abc]');

    line = new TagCompleter.InputLine('[a', TestTags);
    assert.equals(5, line.insertionTag('abc', 1));
    assert.equals(line.suggest(5), []);
    assert.equals(line.value, '[abc]a');

    line = new TagCompleter.InputLine('[a[foo]komment', TestTags);
    assert.equals(9, line.insertionTag('afoobar', 2));
    assert.equals(line.suggest(9), []);
    assert.equals(line.value, '[afoobar][foo]komment');
}







