Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");


function TagSearch() {}

extend(TagSearch.prototype, {
    get wrappedJSObject () this,

    classDescription: "Auto Complete Search for Hatena Bookmark Tags",
    classID:          Components.ID("{ded2a120-02dc-11de-87af-0800200c9a66}"),
    contractID:       "@mozilla.org/autocomplete/search;1?name=hbookmark-tag",

    startSearch: function TS_startSearch(searchString, searchParam,
                                         previousResult, listener) {
        // Search Tags
        p("startSearch", searchString, searchParam, previousResult, listener);

        //listener.onSearchResult(this, result);
    },

    stopSearch: function TS_stopSearch() {},

    getTagFragment: function TS_getTagFragment(commentFragment) {
        let match = commentFragment.match(/^(?:\[[^?%\/\[\]]+\])*\[([^?%\/\[\]]+)$/);
        return match && match[1];
    },

    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIAutoCompleteSearch,
    ])
});


function TagSearchResult() {
}

extend(TagSearchResult.prototype, {
    getCommentAt: function TSR_getCommentAt(index) {},
    getImageAt: function TSR_getImageAt(index) {},
    getStyleAt: function TSR_getStyleAt(index) {},
    getValueAt: function TSR_getValueAt(index) {},

    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIAutoCompleteResult,
    ])
});


function NSGetModule(compMgr, fileSpec)
    XPCOMUtils.generateModule([TagSearch]);
