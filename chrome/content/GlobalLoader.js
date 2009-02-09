
var GlobalLoader = {};
GlobalLoader.loadAll = function(grobal) {
    if (!grobal) 
        grobal = {};

    var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].
            getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript;
    
    var exports = {
        Cc                      : Cc,
        Ci                      : Ci,
        Application             : Application,
        browserWindow           : window,
        PrefetchService         : Cc["@mozilla.org/prefetch-service;1"].getService(Ci.nsIPrefetchService),
        ObserverService         : Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
        StorageService          : Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService),
        IOService               : Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
        StorageStatementWrapper : Components.Constructor('@mozilla.org/storage/statement-wrapper;1', 'mozIStorageStatementWrapper', 'initialize'),
    };
    
    for (var key in exports) {
        grobal[key] = exports[key];
    }
    grobal.hBookmark = {}; // bookmark main namespace
    
    var libraries = ['00_utils', '05_database', '06_models', '10_sync'];
    
    for each (var key in libraries) {
        var uri = 'chrome://hatenabookmark/content/javascripts/' + key + '.js';
        loader(uri, grobal);
    }

    loader('chrome://hatenabookmark/content/HatenaBookmark.js', grobal);
    return grobal;
};

