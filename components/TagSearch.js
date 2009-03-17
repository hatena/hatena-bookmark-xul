Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function setup() {
    Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
    Components.utils.import("resource://hatenabookmark/modules/10-event.jsm");
    let loadSubScript = Cc["@mozilla.org/moz/jssubscript-loader;1"].
                        getService(Ci.mozIJSSubScriptLoader).loadSubScript;
    function load(uri) {
        let env = { __proto__: this };
        loadSubScript(uri, env);
        if (env.EXPORT)
            env.EXPORT.forEach(function (name) this[name] = env[name], this);
    }
    load("chrome://hatenabookmark/content/common/02-utils.js");
    load("chrome://hatenabookmark/content/common/07-prefs.js");
    load("chrome://hatenabookmark/content/common/15-Hatena.js");
    load("chrome://hatenabookmark/content/common/20-Database.js");
    load("chrome://hatenabookmark/content/common/30-Models.js");
    load("chrome://hatenabookmark/content/common/31-Model-Bookmark.js");
    load("chrome://hatenabookmark/content/common/31-Model-Tag.js");
}

let tagSearchInstance = null;

function TagSearch() {
    if (tagSearchInstance) return tagSearchInstance;

    setup();
    return tagSearchInstance = this;
}

TagSearch.prototype = {
    constructor: TagSearch,
    get wrappedJSObject () this,

    classDescription: "Auto Complete Search for Hatena Bookmark Tags",
    classID:          Components.ID("{ded2a120-02dc-11de-87af-0800200c9a66}"),
    contractID:       "@mozilla.org/autocomplete/search;1?name=hbookmark-tag",

    startSearch: function TS_startSearch(searchString, searchParam,
                                         previousResult, listener) {
        p("[@startSearch]", searchString, searchParam, previousResult, listener);
        let result = new TagSearchResult(searchParam);
        listener.onSearchResult(this, result);
    },

    stopSearch: function TS_stopSearch() {},

    QueryInterface: XPCOMUtils.generateQI([
        Components.interfaces.nsIAutoCompleteSearch,
    ])
};


function TagSearchResult(partialTag) {
    this._tags = Model.Tag.findTagCandidates(partialTag);
    this.defaultIndex = 0;
    this.errorDescription = "";
    this.matchCount = this._tags.length;
    this.searchResult = this._tags.length
        ? Components.interfaces.nsIAutoCompleteResult.RESULT_SUCCESS
        : Components.interfaces.nsIAutoCompleteResult.RESULT_NOMATCH;
    this.searchString = partialTag;
}

TagSearchResult.prototype = {
    constructor: TagSearchResult,
    get wrappedJSObject () this,

    getValueAt: function TSR_getValueAt(index) this._tags[index].name,
    getCommentAt: function TSR_getCommentAt(index) this._tags[index].name,
    getImageAt: function TSR_getImageAt(index) {},
    getStyleAt: function TSR_getStyleAt(index) {},
    removeValueAt: function TSR_removeValueAt(rowIndex, removeFromDb) {},

    QueryInterface: XPCOMUtils.generateQI([
        Components.interfaces.nsIAutoCompleteResult,
    ])
};


var NSGetModule = XPCOMUtils.generateNSGetModule([TagSearch]);
