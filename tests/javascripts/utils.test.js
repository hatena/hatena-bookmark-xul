/*
 * jsm じゃないほうの util
 */

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
}

function testSprintf()
{
    assert.equals('abcdef', sprintf('a%sc%se%s', 'b','d', 'f'));
    assert.equals('10 20 b 30.55', sprintf('%s %d %s %f', 10, 20.33, 'b', 30.55));
}

function testKeysValues()
{
    let o = {
        k1: 'a',
        k2: 'b',
        k3: 'c',
    };
    assert.equals(['k1', 'k2', 'k3'], keys(o));
    assert.equals(['a', 'b', 'c'], values(o));
}

function testNewURI() {
    let spec = "http://example.org/";
    let uri = newURI(spec);
    assert.equals(uri.spec, spec);

    uri = newURI("bar", null, "http://example.org/foo");
    assert.equals(uri.spec, "http://example.org/bar");
}

function testAsyncMethod()
{
    var foo = 1;
    async.method(function() {
        foo = 30;
    });
    yield 100;
    assert.equals(foo, 30);
}

function testNetsyncget()
{
    let res = net.sync_get('http://b.hatena.ne.jp');

    assert.isTrue(res.responseText.length > 0);
}

function testAsyncExecute()
{
    let asyncExecute = async.splitExecuter;
    let index = -1;
    let loaded = { value: false };
    asyncExecute(Iterator([1,2,3,4,5], true), 2, function(e, i) {
        index = i;
    }, function(i) {
        loaded.value = true;
    });
    assert.equals(-1, index);
    yield 0;
    assert.equals(1, index);
    yield 0;
    assert.equals(3, index);
    yield 0;
    assert.equals(4, index);
    yield loaded;

    index = -1;
    asyncExecute(Iterator([1,2,3,4,5,6,7,8,9], true), 3, function(e, i) {
        index = i;
    });
    assert.equals(-1, index);
    yield 0;
    assert.equals(2, index);
    yield 0;
    assert.equals(5, index);
    yield 0;
    assert.equals(8, index);
}

function testMakeQuery() {
    var data = {
        foo: '日本語 & English',
        bar: undefined,
        baz: ['Hello', 42, '世界'],
    };
    assert.equals('foo=%E6%97%A5%E6%9C%AC%E8%AA%9E+%26+English&' +
                  'baz=Hello&baz=42&baz=%E4%B8%96%E7%95%8C',
                  net.makeQuery(data))
}
