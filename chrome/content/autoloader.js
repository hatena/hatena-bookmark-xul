if (!hBookmark)
    var hBookmark = {};

Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm",
                        hBookmark);

/**
 * 指定されたURIのスクリプトを読み込む。
 * 
 * @param {String} uri スクリプトのURI。"/"で終わっていた場合は
 *                     そのディレクトリ直下のすべてのスクリプトを読み込む。
 */
hBookmark.load = function (uri) {
    if (uri.charAt(uri.length - 1) === "/") {
        var load = arguments.callee;
        load.getScriptURIs(uri)
            .forEach(function (uri) load.call(this, uri), this);
        return;
    }

    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                 .getService(Components.interfaces.mozIJSSubScriptLoader);
    var env = { __proto__: this };
    loader.loadSubScript(uri, env);
    if (env.EXPORT)
        env.EXPORT.forEach(function (name) this[name] = env[name], this);
};

hBookmark.load.getScriptURIs = function (dirURI) {
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    var uris = [];
    var dirPath = dirURI.replace(/^[\w-]+:\/\/[\w.:-]+\//, "");
    var baseURI = 'chrome://hatenabookmark/' + dirPath;
    // XXX jarファイルに固めるのならnsIZipReaderを使ってごにょごにょする。
    var ios = Cc["@mozilla.org/network/io-service;1"].
              getService(Ci.nsIIOService);
    var baseURIObject = ios.newURI(baseURI, null, null);
    var registry = Cc["@mozilla.org/chrome/chrome-registry;1"].
                   getService(Ci.nsIChromeRegistry);
    var dir = registry.convertChromeURL(baseURIObject)
                      .QueryInterface(Ci.nsIFileURL).file;
    if (!dir.exists() || !dir.isDirectory()) return uris;
    var files = dir.directoryEntries;
    while (files.hasMoreElements()) {
        var file = files.getNext().QueryInterface(Ci.nsIFile);
        if (/\.js$/.test(file.leafName))
            uris.push(baseURI + file.leafName);
    }
    return uris.sort();
};

if (!("autoload" in hBookmark) || hBookmark.autoload) {
    hBookmark.loadModules();
    hBookmark.load("chrome://hatenabookmark/content/common/");
    hBookmark.load(location.href.replace(/\.\w+$/, "/"));
}
