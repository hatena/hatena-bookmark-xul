
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

function testSecondlife() {
    var data = utils.readFrom('data/secondlife.search.data', 'UTF-8');
    assert.isTrue(data.length);
    var sary, finder, indexes;

    p.b(function() {
        sary = new SuffixArray(data);
        sary.make();
        finder = sary.finder('Ruby on Rails');
    }, 'create');

    p.b(function() {
        // indexes = [i for (i in finder)];
        indexes = [];
        for (let i = 0;i < 3;i++) {
            try {
                indexes.push(finder.next());
            } catch (e if e instanceof StopIteration) {
            };
        }
    }, 'find');

    p(''+indexes);
    p(indexes.map(function(index) sary.string.substr(index, 10)).join('/'));
}

function testSuffixArray()
{
    return;
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

