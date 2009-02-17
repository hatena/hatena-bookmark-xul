var hBookmark = {
    EXTENSION_ID: "bookmark@hatena.ne.jp",

    Cc: Components.classes,
    Ci: Components.interfaces,
    Cr: Components.results,
    Cu: Components.utils,

    /**
     * 指定されたURIのスクリプトを読み込む。
     * 
     * @param {String} uri スクリプトのURI。"/"で終わっていた場合は
     *                     そのディレクトリ直下のすべてのスクリプトを読み込む。
     *                     省略された場合はcommonディレクトリ及び現在
     *                     スクリプトが読み込まれているXULファイルと同名の
     *                     ディレクトリ直下のすべてのスクリプトを読み込む。
     */
    load: function load(uri) {
        if (!uri) {
            load("/content/common/");
            var leafName = location.pathname.replace(/^.*\/|\..+?$/g, "");
            if (leafName)
                load(leafName + "/");
            return;
        } else if (uri.charAt(uri.length - 1) === "/") {
            load.getScriptURIs(uri).forEach(load);
            return;
        }

        var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                     .getService(Components.interfaces.mozIJSSubScriptLoader);
        var env = { __proto__: hBookmark };
        loader.loadSubScript(uri, env);
        if (env.EXPORT)
            env.EXPORT.forEach(function (name) hBookmark[name] = env[name]);
    }
};

hBookmark.load.getScriptURIs = function (dirURI) {
    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const IOService = Cc["@mozilla.org/network/io-service;1"]
                          .getService(Ci.nsIIOService);
    var uris = [];
    var baseURI = IOService.newURI(location.href, null, null).resolve(dirURI);
    var dirPath = baseURI.replace(/^[\w-]+:\/\/[\w.:-]+\//, "");
    var em = Cc["@mozilla.org/extensions/manager;1"]
                 .getService(Ci.nsIExtensionManager);
    // XXX jarファイルに固めるのならnsIZipReaderを使ってごにょごにょする。
    var dir = em.getInstallLocation(hBookmark.EXTENSION_ID)
                .getItemFile(hBookmark.EXTENSION_ID, "chrome/" + dirPath);
    if (!dir.exists() || !dir.isDirectory()) return uris;
    var files = dir.directoryEntries;
    while (files.hasMoreElements()) {
        var file = files.getNext().QueryInterface(Ci.nsIFile);
        if (/\.js$/.test(file.leafName))
            uris.push(baseURI + file.leafName);
    }
    return uris.sort();
};

hBookmark.load();
