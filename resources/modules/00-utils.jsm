// エクスポートしたくないメンバの名前はアンダースコア(_)からはじめること。

const B_HOST = 'b.hatena.ne.jp';
const B_HTTP = 'http://' + B_HOST + '/';
const B_STATIC_HOST = 'cdn-ak.b.st-hatena.com';
const B_STATIC_HTTP = 'http://' + B_STATIC_HOST + '/';
const B_API_STATIC_HOST = 'api.b.st-hatena.com';
const B_API_STATIC_HTTP = 'http://' + B_API_STATIC_HOST + '/';

/*
const B_HOST = 'local.hatena.ne.jp:3000';
const B_HTTP = 'http://' + B_HOST + '/';
const B_STATIC_HOST = 'local.hatena.ne.jp:3000';
const B_STATIC_HTTP = 'http://' + B_STATIC_HOST + '/';
const B_API_STATIC_HOST = 'local.hatena.ne.jp:3000';
const B_API_STATIC_HTTP = 'http://' + B_API_STATIC_HOST + '/';
*/

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const EXT_ID = 'bookmark@hatena.ne.jp';

let getService = function getService(name, i) {
    let interfaces = Array.concat(i);
    let service = Cc[name].getService(interfaces.shift());
    interfaces.forEach(function(i) service.QueryInterface(i));
    return service;
};

// See https://developer.mozilla.org/en/OS_TARGET for OS_TARGET values.
const OS_TARGET = getService('@mozilla.org/xre/app-info;1', Ci.nsIXULRuntime).OS;
const IS_WIN = OS_TARGET.indexOf("WIN") === 0;
const IS_MAC = OS_TARGET === "Darwin";
const IS_OSX = IS_MAC;

const Application =
    getService("@mozilla.org/fuel/application;1", Ci.fuelIApplication);
const PrefetchService =
    getService("@mozilla.org/prefetch-service;1", Ci.nsIPrefetchService);
const DirectoryService =
    getService('@mozilla.org/file/directory_service;1', Ci.nsIProperties);

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
const PrefService = 
    getService("@mozilla.org/preferences-service;1", [Ci.nsIPrefService, Ci.nsIPrefBranch, Ci.nsIPrefBranch2]);
const CookieManager =
     getService("@mozilla.org/cookiemanager;1", Ci.nsICookieManager);
const CookieService=
     getService("@mozilla.org/cookieService;1", Ci.nsICookieService);
const PromptService =
    getService("@mozilla.org/embedcomp/prompt-service;1", Ci.nsIPromptService);
const AtomService =
    getService("@mozilla.org/atom-service;1", Ci.nsIAtomService);

const CryptoHash = 
    Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);

const StorageStatementWrapper =
    Components.Constructor('@mozilla.org/storage/statement-wrapper;1', 'mozIStorageStatementWrapper', 'initialize');

var XMigemoCore, XMigemoTextUtils;
try{
    // XUL migemo
    XMigemoCore = Cc['@piro.sakura.ne.jp/xmigemo/factory;1']
                            .getService(Components.interfaces.pIXMigemoFactory)
                            .getService('ja');
    XMigemoTextUtils = Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1']
                            .getService(Ci.pIXMigemoTextUtils);
}
catch(ex if ex instanceof TypeError){}

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const XBL_NS = "http://www.mozilla.org/xbl";
const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";
const HB_NS = "http://b.hatena.ne.jp/";

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

/* utility functions */
var nowDebug = !!Application.prefs.get('extensions.hatenabookmark.debug.log').value;

// window.XMLHttpRequest が存在しなくても大丈夫なように
var XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1");
var XMLSerializer = Components.Constructor("@mozilla.org/xmlextras/xmlserializer;1");
var DOMParser = Components.Constructor("@mozilla.org/xmlextras/domparser;1");
var XPathEvaluator = Components.Constructor("@mozilla.org/dom/xpath-evaluator;1");
var XPathResult = Ci.nsIDOMXPathResult;

var BuiltInTimer = Components.Constructor("@mozilla.org/timer;1", "nsITimer", "init");

/*
 * p は一時デバッグ用
 */
var p = function (value) {
    log.info(''+value);
    return value;
}

p.e = function(value) {
    log.info(uneval(value));
    return value;
}

/*
 * 簡易ベンチマーク
 */
p.b = function (func, name) {
    name = 'Benchmark ' + (name || '') + ': ';
    let now = new Date * 1;
    func();
    let t = (new Date * 1) - now;
    p(name + t);
    return t;
}

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
        if (nowDebug) {
            Application.console.log((msg || '').toString());
        }
    }
}

p.observe = function Prefs_observe (aSubject, aTopic, aData) {
     if (aTopic != "nsPref:changed") return;

     if (aData == 'extensions.hatenabookmark.debug.log') {
         nowDebug = !!Application.prefs.get('extensions.hatenabookmark.debug.log').value;
     }
}

PrefService.addObserver('', p, false);

var createElementBindDocument = function(doc, ns) {
    return function(name, attr) {
        var children = Array.slice(arguments, 2);
        var e = ns ? doc.createElementNS(ns, name) : doc.createElement(name);
        if (ns) {
        }
        if (attr) for (let key in attr) e.setAttribute(key, attr[key]);
        children.map(function(el) el.nodeType > 0 ? el : doc.createTextNode(el)).
            forEach(function(el) e.appendChild(el));
        return e;
    }
}

var UIEncodeText = function(str) {
    return decodeURIComponent(escape(str));
}


/*
 * elementGetter(this, 'myList', 'my-list-id-name', document);
 * list //=> document.getElementById('my-list-id-name');
 */
var elementGetter = function(self, name, idName, doc, uncache) {
    var element;
    self.__defineGetter__(name, function() {
        if (uncache)
            return doc.getElementById(idName);
        if (!element) {
            element = doc.getElementById(idName);
        }
        return element;
    });
}

var iri2uri = function(iri) {
    return IOService.newURI(iri, null, null).asciiSpec;
}

var escapeIRI = function(iri) {
    return encodeURIComponent(iri2uri(iri));
}

var entryURL = function(url) {
    let suffix = iri2uri(url).replace(/#/g, '%23');
    if (suffix.indexOf("http://") === 0)
        suffix = suffix.substring(7);
    else if (suffix.indexOf("https://") === 0)
        suffix = "s/" + suffix.substring(8);
    return B_HTTP + 'entry/' + suffix;
}

var addPageURL = function(url) {
    return B_HTTP + 'entry/add/' + iri2uri(url).replace(/#/g, '%23');
}

var isInclude = function(val, ary) {
    for (var i = 0;  i < ary.length; i++) {
        if (ary[i] == val) return true;
    }
    return false;
}

var bind = function bind(func, self) function () func.apply(self, Array.slice(arguments));
var method = function method(self, methodName) function () self[methodName].apply(self, Array.slice(arguments));

// 特定のウィンドウに属さない辞書用オブジェクトの作成
function DictionaryObject() ({ __proto__: null });

/*
 * 共用グローバル変数
 */
let _shared = new DictionaryObject();
var shared = {
    get: function shared_get (name) {
        return (name in _shared) ? _shared[name] : void 0;
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

// これと同じことができる XPCOM コンポーネントはないの?
function decodeReferences(string)
    string.replace(/&(?:#(\d+|[xX][0-9a-fA-F]+)|([\w-]+));/g, _referenceReplacement);

function _referenceReplacement(reference, number, name) {
    return number ? String.fromCharCode("0" + number)
                  : (_referenceMap[name] || reference);
}

let _referenceMap = {
    amp:   "&",
    lt:    "<",
    gt:    ">",
    quot:  '"',
    apos:  "'",
    nbsp:  "\u00a0",
    copy:  "\u00a9",
    reg:   "\u00ae",
    trade: "\u2122",
    laquo: "\u00ab",
    raquo: "\u00bb",
    __proto__: null
};

/*
 * JSON デコード/エンコード
 */
function decodeJSON(json) {
    try {
        return (typeof JSON === "object")
            ? JSON.parse(json)
            : Cc['@mozilla.org/dom/json;1'].createInstance(Ci.nsIJSON)
                                           .decode(json);
    } catch (ex) {
        return null;
    }
}

function encodeJSON(object) {
    try {
        return (typeof JSON === "object")
            ? JSON.stringify(object)
            : Cc['@mozilla.org/dom/json;1'].createInstance(Ci.nsIJSON)
                                           .encode(object);
    } catch (ex) {
        return "";
    }
}

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

// XPath 式中の接頭辞のない名前テストに接頭辞 prefix を追加する
// e.g. '//body[@class = "foo"]/p' -> '//prefix:body[@class = "foo"]/prefix:p'
function addDefaultPrefix(xpath, prefix) {
    const tokenPattern = /([A-Za-z_\u00c0-\ufffd][\w\-.\u00b7-\ufffd]*|\*)\s*(::?|\()?|(".*?"|'.*?'|\d+(?:\.\d*)?|\.(?:\.|\d+)?|[\)\]])|(\/\/?|!=|[<>]=?|[\(\[|,=+-])|([@$])/g;
    const TERM = 1, OPERATOR = 2, MODIFIER = 3;
    var tokenType = OPERATOR;
    prefix += ':';
    function replacer(token, identifier, suffix, term, operator, modifier) {
        if (suffix) {
            tokenType = (suffix == ':' || (suffix == '::' &&
                         (identifier == 'attribute' || identifier == 'namespace')))
                        ? MODIFIER : OPERATOR;
        } else if (identifier) {
            if (tokenType == OPERATOR && identifier != '*')
                token = prefix + token;
            tokenType = (tokenType == TERM) ? OPERATOR : TERM;
        } else {
            tokenType = term ? TERM : operator ? OPERATOR : MODIFIER;
        }
        return token;
    }
    return xpath.replace(tokenPattern, replacer);
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
    if (_getModuleURIs.uris) return _getModuleURIs.uris;
    var uris = [];
    var files = __LOCATION__.parent.directoryEntries;
    while (files.hasMoreElements()) {
        var file = files.getNext().QueryInterface(Ci.nsIFile);
        if (/\.jsm?$/.test(file.leafName))
            uris.push(_MODULE_BASE_URI + file.leafName);
    }
    return _getModuleURIs.uris = uris.sort();
}

/*
 * original code by tombloo
 * http://github.com/to/tombloo
 * 以下のコードのライセンスは Tombloo のライセンスに従います
 */

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
        before.apply(this, arguments);
        return original.apply(this, arguments);
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
var EXPORTED_SYMBOLS = [m for (m in new Iterator(this, true))
                          if (m[0] !== "_" && m !== "EXPORTED_SYMBOLS")];

/* Debug
EXPORTED_SYMBOLS.push.apply(EXPORTED_SYMBOLS,
                            [m for (m in new Iterator(this, true))
                               if (m[0] === "_")]);
//*/
