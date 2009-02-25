var hBookmark;
var candidates;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/browser.xul");
    hBookmark = global.hBookmark;
}

function setUp() {
    //prepareDatabase(hBookmark);

    candidates = new hBookmark.TagCandidates();
}

function testGetTagFragment() {
    let fragment;

    fragment = candidates.getTagFragment("[a");
    assert.equals(fragment, "a");
    fragment = candidates.getTagFragment("[");
    assert.equals(fragment, "");
    fragment = candidates.getTagFragment("[a]");
    assert.equals(fragment, null);
    fragment = candidates.getTagFragment("[a][bc");
    assert.equals(fragment, "bc");
    fragment = candidates.getTagFragment("[a]bc");
    assert.equals(fragment, null);
}

function testFind() {
    // XXX とりあえずの間に合わせ
    delete candidates.__proto__.tags;
    candidates.tags = "a ab abc ac ae afa afb ba".split(" ").sort();

    assert.equals(candidates.find("a"), "a ab abc ac ae afa afb".split(" "));
    assert.equals(candidates.find("ab"), "ab abc".split(" "));
    assert.equals(candidates.find("af"), "afa afb".split(" "));
    assert.equals(candidates.find("ad"), []);
}
