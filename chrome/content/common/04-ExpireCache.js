
/*
 * 有効期限付きキャッシュ
 * 現在はブラウザを閉じるとすべて消える
 * 本当は storage.jsm を利用して、適宜キャッシュを削除すべき
 */
const EXPORT = ['ExpireCache'];

var ExpireCache = function(key, defaultExpire) {
    this.key = key;
    this.defaultExpire = 60 * 30; // 30分
}

this.__defineGetter__('now', function() (new Date-0));

ExpireCache.prototype = {
    get key() this._key,
    set key(value) {
        this._key = value || 'global';
        if (!shared[this.sharedKey])
            shared[this.sharedKey] = {};
    },
    get sharedKey() '_cache_' + this._key,
    get cache() shared[this.sharedKey],
    get: function ExpireCache_get (key) {
        return this.has(key) ? this.cache[key][0] : null;
    },
    _update: function ExpireCache__update(key) {
        if (!this.cache[key]) return;
        let [_, expire] = this.cache[key];
        if (now >= expire) 
            delete this.cache[key]
    },
    has: function ExpireCache_has(key) {
        this._update(key);
        return !!this.cache[key];
    },
    set: function ExpireCache_set(key, value, expire) {
        if (!expire) expire = this.defaultExpire;
        let e = now + (expire * 1000);
        this.cache[key] = [value, e];
    },
}

