// エクスポートしたくないメンバの名前はアンダースコア(_)からはじめること。

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

const Application =
    Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
const PrefetchService =
    Cc["@mozilla.org/prefetch-service;1"].getService(Ci.nsIPrefetchService);
const ObserverService =
    Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
const StorageService =
    Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
const IOService =
    Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const StorageStatementWrapper =
    Components.Constructor('@mozilla.org/storage/statement-wrapper;1', 'mozIStorageStatementWrapper', 'initialize');

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
        if (msg instanceof 'Error') {
            // スタックトレースを表示？
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
// end from Tombloo

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

var bind = function bind(func, self) function () func.apply(self, Array.slice(arguments));
var method = function method(self, methodName) function () self[methodName].apply(self, Array.slice(arguments));

// XXX model関数はmodel.jsmに置かないとスコープ的にまずい?
var model = function(name) {
    var m = this.Model[name];
    if (!m) { throw 'model not found' };
    return m;
}

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
