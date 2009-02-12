const EXPORTED_SYMBOLS = [
    "extend", "require", "setRequireBase", "extendNative"
];

var requireBase = "resource://hatenabookmark/modules/";

// copy from Tombloo
/**
 * オブジェクトのプロパティをコピーする。
 * ゲッター/セッターの関数も対象に含まれる。
 * 
 * @param {Object} target コピー先。
 * @param {Object} source コピー元。
 * @return {Object} コピー先。
 */
function extend(target, source, overwrite) {
    overwrite = overwrite == null ? true : overwrite;
    for (var p in source) {
        var getter = source.__lookupGetter__(p);
        if (getter)
            target.__defineGetter__(p, getter);
        
        var setter = source.__lookupSetter__(p);
        if (setter)
            target.__defineSetter__(p, setter);
        
        if (!getter && !setter && (overwrite || !(p in target)))
            target[p] = source[p];
    }
    return target;
}

/**
 * モジュールをインポートする。
 * ドット区切りの階層がディレクトリ階層に反映される。
 * 
 * @param {Object} target インポート先のオブジェクト。
 * @param {Object} name 階層を含めたモジュール名。
 * @return {Object} インポートしたモジュールのグローバルオブジェクト。
 */
function require(target, path) {
    var uri = requireBase + path.replace(/\./g, "/") + ".jsm";
    var parts = path.split(".").slice(0, -1);
    while (parts.length) {
        var part = parts.shift();
        target = target[part] || new target.__parent__.Object();
    }
    return Components.utils.import(uri, target);
}

/**
 * require() でインポートするモジュールの基底URIを設定する。
 * 
 * @param {Object} base モジュールをインポートする際の基底URI。
 */
function setRequireBase(base) {
    requireBase = base;
}

function extendNative(global) {
    global.Array.prototype.clone = global.Array.prototype.concat;
    extend(global.Array.prototype, ArrayExtensions);
    extend(global.String.prototype, StringExtensions);
}

var ArrayExtensions = {
    find: function (callback, thisObject) {
        for (var i = 0, length = this.length; i < length; i++) {
            if (i in this) {
                var e = this[i];
                if (callback.call(thisObject, e, i, this))
                    return e;
            }
        }
        return undefined;
    }
};

var StringExtensions = {};
