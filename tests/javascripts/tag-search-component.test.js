
function setUp() {
    utils.include("../../components/TagSearch.js");
}

function testGetTagSearchService() {
    let TagSearch = Components.classes["@mozilla.org/autocomplete/search;1?name=hbookmark-tag"].
                    getService(Components.interfaces.nsIAutoCompleteSearch);
    assert.isTrue(TagSearch instanceof Components.interfaces.nsIAutoCompleteSearch);
}
