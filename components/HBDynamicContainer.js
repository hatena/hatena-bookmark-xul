/* for Test
var bs = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                   .getService(Components.interfaces.nsINavBookmarksService);
var dc = bs.createDynamicContainer(bs.toolbarFolder,
                                   "Recent Hatena Bookmarks",
                                   "@hatena.ne.jp/bookmark/dynamic-container;1",
                                   bs.DEFAULT_INDEX);
alert(dc);
*/

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function firstLoad() {
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
    firstLoad = null;
}

function HBookmarkDynamicContainer() {
    if (firstLoad) firstLoad();
}

HBookmarkDynamicContainer.prototype = {
    constructor: HBookmarkDynamicContainer,
    get wrappedJSObject () this,
    classDescription: "Hatena Bookmark Dynamic Container",
    classID: Components.ID("{df0b47b0-0c7c-11de-8c30-0800200c9a66}"),
    contractID: "@hatena.ne.jp/bookmark/dynamic-container;1",

    onContainerNodeOpening: function HBDC_onOpening(container, options) {
        let bookmarks = Model.Bookmark.find({
            order: "date DESC",
            limit: Prefs.bookmark.get("toolbarMenuCount") || 10
        });
        p("[onContainerNodeOpening]", bookmarks.map(function (b) b.title).join("\n"));
        bookmarks.forEach(function (bookmark) {
            // XXX ToDo: 最後の引数にfaviconのURI (文字列)を指定する。
            container.appendURINode(bookmark.url, bookmark.title, 0,
                                    +bookmark.date, null);
        });
    },

    onContainerNodeClosed: function HBDC_onClosed() {},
    onContainerRemoving: function HBDC_onRemoving(container) {},
    onContainerMoved: function HBDC_onMoved() {},

    QueryInterface: XPCOMUtils.generateQI([
        Components.interfaces.nsIDynamicContainer
    ])
};

var NSGetModule = XPCOMUtils.generateNSGetModule([HBookmarkDynamicContainer]);
