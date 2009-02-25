let TagSearch;

function setUp() {
    TagSearch = Components.classes["@mozilla.org/autocomplete/search;1?name=hbookmark-tag"].
                getService(Components.interfaces.nsIAutoCompleteSearch);
}

function testTagSearch() {
    assert.isTrue(TagSearch instanceof Components.interfaces.nsIAutoCompleteSearch);
}

function testGetTagFragment() {
    let ts = TagSearch.wrappedJSObject;
    assert.equals(ts.getTagFragment("["), null);
    assert.equals(ts.getTagFragment("[a"), "a");
    assert.equals(ts.getTagFragment("[a]"), null);
    assert.equals(ts.getTagFragment("[a]["), null);
    assert.equals(ts.getTagFragment("[a][b"), "b");
    assert.equals(ts.getTagFragment("[a]b[c"), null);
}
