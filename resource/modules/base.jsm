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
 * @param {Boolean} overwrite 既存のプロパティも上書きする。初期値はtrue。
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
 * @param {String} name 階層を含めたモジュール名。
 * @return {Object} インポートしたオブジェクト。
 */
function require(path) {
    var target = this;
    var segments = path.split(".");
    var leaf = segments.pop();
    while (segments.length) {
        var segment = segments.shift();
        target = target[segment] || (target[segment] = {});
    }
    var predecessor = target[leaf];
    var uri = requireBase + path.replace(/\./g, "/") + ".jsm";
    Components.utils.import(uri, target);
    if (predecessor && target[leaf])
        extend(target[leaf], predecessor, false);
    return target[leaf];
}

/**
 * require() でモジュールをインポートする際の基底URIを設定する。
 * 
 * @param {String} base モジュールをインポートする際の基底URI。
 */
function setRequireBase(base) {
    requireBase = base;
}

/**
 * 配列、文字列といったネイティブオブジェクトのプロトタイプを拡張する。
 * 
 * @param {Object} global 拡張するネイティブオブジェクトが
 *                        属するグローバルオブジェクト。
 */
function extendNative(global) {
    global.Array.prototype.clone = global.Array.prototype.concat;
    extend(global.Array.prototype, ArrayExtensions);
    extend(global.String.prototype, StringExtensions);
}

var ArrayExtensions = {
    contains: function (value) this.indexOf(value) != -1,
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
