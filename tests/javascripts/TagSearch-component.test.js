function testGetTagSearchService() {
    let TagSearch = Cc["@mozilla.org/autocomplete/search;1?name=hbookmark-tag"].
                    getService(Ci.nsIAutoCompleteSearch);
    assert.isTrue(TagSearch instanceof Ci.nsIAutoCompleteSearch);
}
