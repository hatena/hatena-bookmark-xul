
/*
 * 有効期限付きキャッシュ
 * 現在はブラウザを閉じるとすべて消える
 */
const EXPORT = ['ExpireCache', 'HTTPCache'];

var ExpireCache = function(key, defaultExpire, seriarizer, sweeperDelay) {
    this.key = key;
    this.defaultExpire = 60 * 30; // 30分
    this.seriarizer = ExpireCache.Seriarizer[seriarizer];
    if (!sweeperDelay)
        sweeperDelay = 60 * 60 * 4; // 四時間
    this.sweeper = new Timer(1000 * sweeperDelay);
    this.sweeper.createListener('timer', method(this, 'sweepHandler'));
    this.sweeper.start();
}

this.__defineGetter__('now', function() (new Date-0));

ExpireCache.Seriarizer = {};

ExpireCache.Seriarizer.uneval = {
    seriarize: function(value) uneval(value),
    deseriarize: function(value) eval(value),
}

ExpireCache.prototype = {
    sweepHandler: function() {
        for (key in this.cache) {
            this._update(key);
        }
    },
    get key() this._key,
    set key(value) {
        this._key = value || 'global';
        if (!shared[this.sharedKey])
            shared[this.sharedKey] = {};
    },
    get sharedKey() '_cache_' + this._key,
    get cache() shared[this.sharedKey],
    deseriarize: function ExpireCache_deseriarize(value) {
        if (!this.seriarizer) return value;

        return this.seriarizer.deseriarize(value);
    },
    seriarize: function ExpireCache_seriarize(value) {
        if (!this.seriarizer) return value;

        return this.seriarizer.seriarize(value);
    },
    get: function ExpireCache_get (key) {
        return this.has(key) ? this.deseriarize(this.cache[key][0]) : null;
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
    clear: function ExpireCache_clear(key) {
        if (this.cache[key]) {
            delete this.cache[key];
            return true;
        } else {
            return false;
        }
    },
    clearAll: function ExpireCache_clearAll() {
        this.cache = {};
    },
    set: function ExpireCache_set(key, value, expire) {
        if (!expire) expire = this.defaultExpire;
        let e = now + (expire * 1000);
        this.cache[key] = [this.seriarize(value), e];
    },
}

/*
 * HTTP 上のデータを抽象化
 */
var HTTPCache = function(key, options) {
    if (!options) options = {};
    this.options = options;
    this.cache = new ExpireCache(key, options.expire, options.seriarizer);
}

HTTPCache.prototype = {
    createURL: function HTTPCache_createURL (url) {
        if (this.options.encoder)
            url = this.options.encoder(url);
        return (this.options.baseURL || '') + url;
    },
    isValid: function(url) {
        return true;
    },
    async_get: function HTTPCache_async_get(url, callback) {
        if (!this.isValid(url)) return callback(null);
        let cache = this.cache;
        if (cache.has(url)) {
            let val = cache.get(url);
            setTimeout(function() {
                callback(val);
            }, 0);
        } else {
            let self = this;
            net.get(this.createURL(url), function(res) {
                callback(self.setResCache(url, res));
            }, function() {
                cache.set(url, null);
                callback(null);
            }, true);
        }
    },
    get: function HTTPCache_get (url, force, async) {
        if (!this.isValid(url)) return null;
        let cache = this.cache;
        if (!force && cache.has(url)) {
            p('http using cache: ' + url);
            return cache.get(url);
        }
        let res = net.sync_get(this.createURL(url));
        return this.setResCache(url, res);
    },
    setResCache: function HTTPCache_setResCache(url, res) {
        let cache = this.cache;
        if (res.status != 200) {
            cache.set(url, null);
            return null;
        }
        let val = res.responseText;
        if (this.options.json) {
            // ({foo: 'bar'}) な JSON 対策
            if (val.indexOf('(') == 0) {
                val = val.substring(1);
                val = val.substr(0, val.lastIndexOf(')'));
            }
            val = decodeJSON(val);
        }
        cache.set(url, val);
        p('http not using cache: ' + url);
        return cache.get(url);
    },
    clear: function HTTPCache_clear (url) {
        let cache = this.cache;
        return cache.clear(url);
    },
    has: function HTTPCache_has (url) {
        let cache = this.cache;
        return cache.has(url);
    }
}

HTTPCache.counter = new HTTPCache('counterCache', {
    expire: 60 * 60,
    baseURL: 'http://b.hatena.ne.jp/entry.count?url=',
    encoder: encodeURIComponent,
});

HTTPCache.counter.isValid = function(url) {
    if (url.indexOf('https://') == 0 && Application.prefs.get('extensions.hatenabookmark.statusbar.httpsIgnore').value) {
        return false;
    } else {
        return true;
    }
};

HTTPCache.comment = new HTTPCache('commentCache', {
    expire: 60 * 60,
    baseURL: 'http://b.hatena.ne.jp/entry/json/?url=',
    seriarizer: 'uneval',
    json: true,
    encoder: encodeURIComponent,
});

HTTPCache.entry = new HTTPCache('entryCache', {
    expire: 60 * 4,
    baseURL: 'http://b.hatena.ne.jp/my.entry?url=',
    seriarizer: 'uneval',
    json: true,
    encoder: encodeURIComponent,
});




