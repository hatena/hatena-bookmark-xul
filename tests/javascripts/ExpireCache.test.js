
var _global = this;
var hBookmark;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/unknown.xul");
    hBookmark = global.hBookmark;
    hBookmark.extend(_global, hBookmark);
}

function setUp() {
    let filter = "['\\^https:\\/\\/.*\\$', '\\^https?:\\/\\/192\\\\.168\\\\.\\\\d+\\\\.\\\\d+.*\\$', '\\^https?:\\/\\/172\\\\.((1[6-9])|(2[0-9])|(3[0-1]))\\\\.\\\\d+\\\\.\\\\d+.*\\$', '\\^https?:\\/\\/10\\\\.\\\\d+\\\\.\\\\d+\\\\.\\\\d+.*\\$']";
    HTTPCache.counter.setFilter(eval(filter));
}

function testSeriarizer() {
    let cache = new ExpireCache('unevaltest', null, 'uneval');
    cache.set('foo', {foo: 1, bar: 2});
    assert.equals(1, cache.get('foo').foo);
    assert.equals(2, cache.get('foo').bar);
}

function testCache() {
    let cache = new ExpireCache();
    let cache2 = new ExpireCache('foo');
    cache.set('foo', 1);
    assert.isTrue(cache.has('foo'));
    assert.isFalse(cache.has('oooo'));
    assert.equals(cache.get('foo'), 1);
    assert.isNull(cache2.get('foo'));
    assert.isFalse(cache2.get('foo'));

    cache.set('f', 0);
    assert.isTrue(cache.has('f'));

    cache.set('bar', 1, 1);
    yield 2000;
    assert.isNull(cache.get('bar'));
    assert.isFalse(cache.has('bar'));
}

function testHTTPCounter() {
    assert.isTrue(HTTPCache.counter.get('http://www.hatena.ne.jp/my') > 10);
    assert.isTrue(HTTPCache.counter.has('http://www.hatena.ne.jp/my'));
    assert.isTrue(HTTPCache.counter.get('http://www.hatena.ne.jp/my') > 10);
}

function testHTTPSCounter() {
    let c = HTTPCache.counter;

    assert.isFalse(c.isValid('https://example.com/'));
    assert.isTrue(c.isValid('http://example.com/'));
}

function testLocalURLS() {
    let c = HTTPCache.counter;
    assert.isFalse(c.isValid('http://10.3.2.2/hogehuga?foo=bar'));
    assert.isFalse(c.isValid('https://10.3.2.2/hogehuga?foo=bar'));
    assert.isFalse(c.isValid('http://192.168.3.22/'));
    assert.isFalse(c.isValid('https://192.168.3.22/'));
    assert.isFalse(c.isValid('http://192.168.255.200/hogehuga?foo=bar'));
    assert.isTrue(c.isValid('http://10.example.com/hogehuga?foo=bar'));
    assert.isTrue(c.isValid('http://172.168.3.22/'));
    assert.isFalse(c.isValid('http://172.16.3.22/'));
    assert.isFalse(c.isValid('http://172.16.3.22/foobar?baz'));
    assert.isFalse(c.isValid('http://172.22.3.22/'));
    assert.isFalse(c.isValid('http://172.31.3.22/'));
    assert.isFalse(c.isValid('https://172.31.3.22/'));
    assert.isTrue(c.isValid('http://172.32.3.22/'));
}

function testHTTPComment() {
    let res = HTTPCache.comment.get('http://www.hatena.ne.jp/my');
    assert.isTrue(res);
    assert.isTrue(res.count);
    assert.isTrue(res.title);
}


