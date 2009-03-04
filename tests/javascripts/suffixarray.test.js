
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
    // var data = utils.readFrom('data/naoya.search.data', 'UTF-8');
    data = data.substr(0, data.length * 3/4);
    assert.isTrue(data.length);
    var sary, finder, indexes;

    p.b(function() {
        sary = new SuffixArray(data);
        sary.make();
    }, 'create');

    var word = 'rubyonrails';
    p.b(function() {
        // indexes = [i for (i in finder)];
        indexes = sary.search(word);
    }, 'search');

    p('match:'+indexes.length + ' / ' + indexes);
    p(indexes.map(function(index) sary.string.substr(index-5, word.length+10)).join(" # "));
}


function testSuffixArray()
{
    return;
    let str = <>map foo bar map baz substr mappp ppmap maa
   Construction began in 1974 on the 19 story structure, with plans to name it after a construction materials company that was to call it home.[1] Construction ended in 1974 on the $16 million dollar project,[2] but the namesake suffered economic setbacks and did not move into the building, leaving it nameless.[1] The building opened in 1975, and Benjamin Franklin Federal Savings and Loan Association moved their headquarters to the building and were able to get the building named as the Benjamin Franklin Plaza.[1] 
    </>.toString();
    let sary = new SuffixArray(str);
    p(''+sary.search('llion'));

    return;

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

