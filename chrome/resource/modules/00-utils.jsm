// エクスポートしたくないメンバの名前はアンダースコア(_)からはじめること。

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

const INTERFACES = [key for (key in Ci)];

let getService = function getService(name, i) Cc[name].getService(i);

const Application =
    getService("@mozilla.org/fuel/application;1", Ci.fuelIApplication);
const PrefetchService =
    getService("@mozilla.org/prefetch-service;1", Ci.nsIPrefetchService);
const ObserverService =
    getService("@mozilla.org/observer-service;1", Ci.nsIObserverService);
const StorageService =
    getService("@mozilla.org/storage/service;1", Ci.mozIStorageService);
const IOService =
    getService("@mozilla.org/network/io-service;1", Ci.nsIIOService);
const ThreadManager =
    getService("@mozilla.org/thread-manager;1", Ci.nsIThreadManager);
const HistoryService =
    getService("@mozilla.org/browser/nav-history-service;1", Ci.nsINavHistoryService);
const BookmarksService =
    getService("@mozilla.org/browser/nav-bookmarks-service;1", Ci.nsINavBookmarksService); 
const FaviconService = 
    getService("@mozilla.org/browser/favicon-service;1", Ci.nsIFaviconService);


const StorageStatementWrapper =
    Components.Constructor('@mozilla.org/storage/statement-wrapper;1', 'mozIStorageStatementWrapper', 'initialize');

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const XBL_NS = "http://www.mozilla.org/xbl";
const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

/* utility functions */

/*
 * p は一時デバッグ用
 */
var p = function (value) {
    Application.console.log(Array.map(arguments, String).join("\n"));
    return value;
}

/*
 * log は、実際にエラーコンソールに通知用
 * ToDo: user_pref でこの拡張のデバッグが true なら、info の内容も表示する 
 */
var log = {
    error: function (msg) {
        if (msg instanceof Error) {
            // Cu.reportError(msg);
            Application.console.log('Error: ' + msg.toString() + msg.stack.join("\n"));
        } else {
            Application.console.log('Error: ' + msg.toString());
        }
    },
    info: function (msg) {
        Application.console.log(msg.toString());
    }
}


var isInclude = function(val, ary) {
    for (var i = 0;  i < ary.length; i++) {
        if (ary[i] == val) return true;
    }
    return false;
}

// copy from Tombloo
/**
 * オブジェクトのプロパティをコピーする。
 * ゲッター/セッターの関数も対象に含まれる。
 * 
 * @param {Object} target コピー先。
 * @param {Object} source コピー元。
 * @return {Object} コピー先。
 */
var extend = function extend(target, source, overwrite){
    overwrite = overwrite == null ? true : overwrite;
    for(var p in source){
        var getter = source.__lookupGetter__(p);
        if(getter)
            target.__defineGetter__(p, getter);
        
        var setter = source.__lookupSetter__(p);
        if(setter)
            target.__defineSetter__(p, setter);
        
        if(!getter && !setter && (overwrite || !(p in target)))
            target[p] = source[p];
    }
    return target;
}

/**
 * メソッドが呼ばれる前に処理を追加する。
 * より詳細なコントロールが必要な場合はaddAroundを使うこと。
 * 
 * @param {Object} target 対象オブジェクト。
 * @param {String} name メソッド名。
 * @param {Function} before 前処理。
 *        対象オブジェクトをthisとして、オリジナルの引数が全て渡されて呼び出される。
 */
function addBefore(target, name, before) {
    var original = target[name];
    target[name] = function() {
        before.apply(target, arguments);
        return original.apply(target, arguments);
    }
}

/**
 * メソッドへアラウンドアドバイスを追加する。
 * 処理を置きかえ、引数の変形や、返り値の加工をできるようにする。
 * 
 * @param {Object} target 対象オブジェクト。
 * @param {String || Array} methodNames 
 *        メソッド名。複数指定することもできる。
 *        set*のようにワイルドカートを使ってもよい。
 * @param {Function} advice 
 *        アドバイス。proceed、args、target、methodNameの4つの引数が渡される。
 *        proceedは対象オブジェクトにバインド済みのオリジナルのメソッド。
 */
function addAround(target, methodNames, advice){
    methodNames = [].concat(methodNames);
    
    // ワイルドカードの展開
    for(var i=0 ; i<methodNames.length ; i++){
        if(methodNames[i].indexOf('*')==-1) continue;
        
        var hint = methodNames.splice(i, 1)[0];
        hint = new RegExp('^' + hint.replace(/\*/g, '.*'));
        for(var prop in target) {
            if(hint.test(prop) && typeof(target[prop]) == 'function')
                methodNames.push(prop);
        }
    }
    
    methodNames.forEach(function(methodName){
        var method = target[methodName];
        target[methodName] = function() {
            var self = this;
            return advice(
                function(args){
                    return method.apply(self, args);
                }, 
                arguments, self, methodName);
        };
        target[methodName].overwrite = (method.overwrite || 0) + 1;
    });
}

var update = function (self, obj/*, ... */) {
    if (self === null) {
        self = {};
    }
    for (var i = 1; i < arguments.length; i++) {
        var o = arguments[i];
        if (typeof(o) != 'undefined' && o !== null) {
            for (var k in o) {
                self[k] = o[k];
            }
        }
    }
    return self;
};

/**
 * XPCOMインスタンスの実装しているインターフェース一覧を取得する。
 *
 * @param {Object} obj XPCOMインスタンス。
 * @return {Array} インターフェースのリスト。
 */
function getInterfaces(obj){
    var result = [];
    
    for(var i=0,len=INTERFACES.length ; i<len ; i++){
        var ifc = INTERFACES[i];
        if(obj instanceof ifc)
            result.push(ifc);
    }
    
    return result;
}

function createMock(sample, proto){
    var non = function(){};
    sample = typeof(sample)=='object'? sample : Cc[sample].createInstance();
    
    var ifcs = getInterfaces(sample);
    var Mock = function(){};
    
    for(var key in sample){
        try{
            if(sample.__lookupGetter__(key))
                continue;
            
            var val = sample[key];
            switch (typeof(val)){
            case 'number':
            case 'string':
                Mock.prototype[key] = val;
                continue;
                
            case 'function':
                Mock.prototype[key] = non;
                continue;
            }
        } catch(e){
            // コンポーネント実装により発生するプロパティ取得エラーを無視する
        }
    }
    
    Mock.prototype.QueryInterface = createQueryInterface(ifcs);
    
    // FIXME: extendに変える(アクセサをコピーできない)
    update(Mock.prototype, proto);
    update(Mock, Mock.prototype);
    
    return Mock;
}

function createQueryInterface(ifcNames){
    var ifcs = ['nsISupports'].concat(ifcNames).map(function(ifcName){
        return Ci[''+ifcName];
    });
    
    return function(iid){
        if(ifcs.some(function(ifc){
            return iid.equals(ifc);
        })){
            return this;
        }
        
        throw Components.results.NS_NOINTERFACE;
    }
}
// end from Tombloo

var bind = function bind(func, self) function () func.apply(self, Array.slice(arguments));
var method = function method(self, methodName) function () self[methodName].apply(self, Array.slice(arguments));

// XXX model関数はmodel.jsmに置かないとスコープ的にまずい?
var model = function(name) {
    var m = this.Model[name];
    if (!m) { throw 'model not found' };
    return m;
}

/*
 * 共用グローバル変数
 */
let _shared = {};
var shared = {
    get: function shared_get (name) {
        return _shared[name];
    },
    set: function shared_set (name, value) {
        _shared[name] = value;
    },
    has: function shared_has (name) {
        return !(typeof _shared[name] == 'undefined');
    }
};

/*
 * 文字列変換
 */
function unEscapeURIForUI(charset, string) 
    Cc['@mozilla.org/intl/texttosuburi;1'].getService(Ci.nsITextToSubURI).unEscapeURIForUI(charset, string);

/*
 * favicon 取得
 */

function getFaviconURI (url) {
    let faviconURI;
    let iurl = IOService.newURI(url, null, null);
    try {
        try {
            faviconURI = FaviconService.getFaviconImageForPage(iurl);
        } catch(e) {
            faviconURI = FaviconService.getFaviconForPage(iurl);
        }
    } catch(e) {
        faviconURI = FaviconService.defaultFavicon;
    }
    return faviconURI;
}

const _MODULE_BASE_URI = "resource://hatenabookmark/modules/"

function loadModules() {
    var uris = _getModuleURIs();
    uris.forEach(function (uri) Cu.import(uri, this), this);
}

function loadPrecedingModules() {
    var uris = _getModuleURIs();
    var self = _MODULE_BASE_URI + this.__LOCATION__.leafName;
    var i = uris.indexOf(self);
    if (i === -1) return;
    uris.slice(0, i).forEach(function (uri) Cu.import(uri, this), this);
}

function _getModuleURIs() {
    var uris = [];
    var files = __LOCATION__.parent.directoryEntries;
    while (files.hasMoreElements()) {
        var file = files.getNext().QueryInterface(Ci.nsIFile);
        if (/\.jsm$/.test(file.leafName))
            uris.push(_MODULE_BASE_URI + file.leafName);
    }
    return uris.sort();
}

var EXPORTED_SYMBOLS = [m for (m in new Iterator(this, true))
                          if (m[0] !== "_" && m !== "EXPORTED_SYMBOLS")];

/* Debug
EXPORTED_SYMBOLS.push.apply(EXPORTED_SYMBOLS,
                            [m for (m in new Iterator(this, true))
                               if (m[0] === "_")]);
//*/
