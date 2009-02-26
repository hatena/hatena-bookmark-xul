Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

let loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
             getService(Components.interfaces.mozIJSSubScriptLoader);

function load(uri) {
    let env = { __proto__: this };
    loader.loadSubScript(uri, env);
    if (env.EXPORT)
        env.EXPORT.forEach(function (name) this[name] = env[name], this);
}

function setup() {
    Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
    load("chrome://hatenabookmark/content/common/00-utils.js");
    load("chrome://hatenabookmark/content/common/05_database.js");
    load("chrome://hatenabookmark/content/common/06_models.js");
    load("chrome://hatenabookmark/content/common/07-Model-Bookmark.js");
    load("chrome://hatenabookmark/content/common/07-Model-Tag.js");
}

let firstTime = true;

function TagSearch() {
    if (firstTime) {
        firstTime = false;
        setup();
    }
}

TagSearch.prototype = {
    constructor: TagSearch,
    get wrappedJSObject () this,

    classDescription: "Auto Complete Search for Hatena Bookmark Tags",
    classID:          Components.ID("{ded2a120-02dc-11de-87af-0800200c9a66}"),
    contractID:       "@mozilla.org/autocomplete/search;1?name=hbookmark-tag",

    startSearch: function TS_startSearch(searchString, searchParam,
                                         previousResult, listener) {
        //p("startSearch", searchString, searchParam, previousResult, listener);

        //let partialTag = searchParam.split("\t")[1];
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

    getCommentAt: function TSR_getCommentAt(index) {
        //return index + ([, "st", "nd", "rd"][index % 10] || "th") + " comment";
        return this._tags[index].name;
    },
    getImageAt: function TSR_getImageAt(index) {},
    getStyleAt: function TSR_getStyleAt(index) {},
    getValueAt: function TSR_getValueAt(index) this._tags[index].name,

    removeValueAt: function TSR_removeValueAt(rowIndex, removeFromDb) {},

    QueryInterface: XPCOMUtils.generateQI([
        Components.interfaces.nsIAutoCompleteResult,
    ])
};


function NSGetModule(compMgr, fileSpec)
    XPCOMUtils.generateModule([TagSearch]);
