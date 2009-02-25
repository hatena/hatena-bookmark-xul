Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

let loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].
             getService(Ci.mozIJSSubScriptLoader);

function load(uri) {
    let env = { __proto__: this };
    loader.loadSubScript(uri, env);
    if (env.EXPORT)
        env.EXPORT.forEach(function (name) this[name] = env[name], this);
}

load("chrome://hatenabookmark/content/common/00-utils.js");
load("chrome://hatenabookmark/content/common/05_database.js");
load("chrome://hatenabookmark/content/common/06_models.js");
load("chrome://hatenabookmark/content/common/07-Model-Bookmark.js");
load("chrome://hatenabookmark/content/common/07-Model-Tag.js");


function TagSearch() {}

extend(TagSearch.prototype, {
    get wrappedJSObject () this,

    classDescription: "Auto Complete Search for Hatena Bookmark Tags",
    classID:          Components.ID("{ded2a120-02dc-11de-87af-0800200c9a66}"),
    contractID:       "@mozilla.org/autocomplete/search;1?name=hbookmark-tag",

    startSearch: function TS_startSearch(searchString, searchParam,
                                         previousResult, listener) {
        //p("startSearch", searchString, searchParam, previousResult, listener);

        let result = new TagSearchResult(searchString, +searchParam);
        listener.onSearchResult(this, result);
    },

    stopSearch: function TS_stopSearch() {},

    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIAutoCompleteSearch,
    ])
});


function TagSearchResult(comment, caretPos) {
    let [head, tag, tail] = TagSearchResult.splitComment(comment, caretPos);
    this._tags = Model.Tag.findTagCandidates(tag);
    this._head = head + "[";
    this._tail = "]" + tail;

    this.defaultIndex = 0;
    this.errorDescription = "";
    this.matchCount = this._tags.length;
    this.searchResult = this._tags.length
        ? Ci.nsIAutoCompleteResult.RESULT_SUCCESS
        : Ci.nsIAutoCompleteResult.RESULT_NOMATCH;
    this.searchString = comment;
}

extend(TagSearchResult, {
    splitComment: function TS_splitComment(comment, caretPos) {
        let head = comment.substring(0, caretPos);
        let tail = comment.substring(caretPos);
        let restTag = tail.match(/^([^?%\/\[\]]*)\]/);
        if (restTag) {
            head += restTag[1];
            tail = tail.substring(restTag[0].length);
        }
        let tag = null;
        let lastTag = head.match(/^(?:\[[^?%\/\[\]]+\])*\[([^?%\/\[\]]+)$/);
        if (lastTag) {
            tag = lastTag[1];
            head = head.substring(0, head.length - tag.length - 1);
        }
        return [head, tag, tail];
    }
});

extend(TagSearchResult.prototype, {
    getCommentAt: function TSR_getCommentAt(index) {
        return index + [, "st", "nd", "rd"][index % 10] + " comment";
    },
    getImageAt: function TSR_getImageAt(index) {},
    getStyleAt: function TSR_getStyleAt(index) {},
    getValueAt: function TSR_getValueAt(index) {
        return this._head + this._tags[index].name + this._tail;
    },

    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIAutoCompleteResult,
    ])
});


function NSGetModule(compMgr, fileSpec)
    XPCOMUtils.generateModule([TagSearch]);
