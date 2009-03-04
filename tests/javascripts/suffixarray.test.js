
var _global = this;
var hBookmark;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/unknown.xul");
    hBookmark = global.hBookmark;
    hBookmark.extend(_global, hBookmark);
}

function setUp() {
}

function tearDown() {
}


function testSuffixArray()
{
    let sary = new SuffixArray('foobarbazmumubax');
    let finder = sary.finder('ba');

    let index;
    index = finder.next();
    assert.equals(index, 3);
    index = finder.next();
    assert.equals(index, 6);
    index = finder.next();
    assert.equals(index, 13);

    assert.raises(StopIteration, function() {
        finder.next();
    }, this);

    finder = sary.finder('x');
    index = finder.next();
    assert.equals(index, sary.length - 1);

    finder = sary.finder('ba');
    let indexes = [i for (i in finder)];
    assert.equals([3,6,13], indexes);
}

