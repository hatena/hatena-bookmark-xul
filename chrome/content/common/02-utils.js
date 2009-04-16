
/*
 * utils 内部では、
 * 頭に _ のついてないローカル変数はすべて EXPORT の対象となる
 */

function newURI(uriSpec, originCharset, baseURI) {
    if (typeof baseURI === "string")
        baseURI = IOService.newURI(baseURI, null, null);
    return IOService.newURI(uriSpec, originCharset, baseURI);
}

function favicon(uri) {
    if (typeof uri === "string")
        uri = IOService.newURI(uri, null, null);
    return FaviconService.getFaviconImageForPage(uri).spec;
}

/*
 * あとで jsm に移植？
 */

/*
 * %s, %d, %f のみサポート
 */
const _SPRINTF_HASH = {
    '%s': String,
    '%d': parseInt,
    '%f': parseFloat,
};

const IS_OSX = navigator.platform.toLowerCase().indexOf('mac') == 0;

var sprintf = function (str) {
    let args = Array.slice(arguments, 1);
    return str.replace(/%[sdf]/g, function(m) _SPRINTF_HASH[m](args.shift()));
};

/*
 * グローバル関数としてエクスポートはしないけど、あったら便利な関数など
 */
var keys = function(obj) [key for (key in obj)];
var values = function(obj) [key for each (key in obj)];

var getHistoryNodeByURL = function getHistoryNodeByURL(url) {
    let query = HistoryService.getNewQuery();
    query.uri = IOService.newURI(url, null, null);
    let options = HistoryService.getNewQueryOptions();
    options.queryType = options.QUERY_TYPE_HISTORY;
    // options.resultType = options.RESULTS_AS_VISIT;
    options.resultType = options.RESULTS_AS_URI;
    let res = HistoryService.executeQuery(query, options);
    let root = res.root;
    try {
        root.containerOpen = true;
        for (let i = 0; i < root.childCount; i++) {
            let node = root.getChild(i);
            return node;
        }
    } finally {
        root.containerOpen = false;
    }
    return;
}

// Timer

var Timer = function(interval, repeatCount) {
    EventService.implement(this);
    this.currentCount = 0;
    this.interval = interval || 60; // ms
    this.repeatCount = repeatCount || 0;
}

Timer.prototype = {
    start: function() {
        this._running = true;
        this.loopTimer = setTimeout(function(self) {
            self.loop();
        }, this.interval, this);
    },
    reset: function() {
        this.stop();
        this.currentCount = 0;
    },
    stop: function() {
        this.clearTimer();
        this._running = false;
    },
    clearTimer: function() {
        if (this.loopTimer) {
            clearTimeout(this.loopTimer);
            delete this.loopTimer;
        }
    },
    get running() this._running,
    loop: function() {
        if (!this.running) return;
        this.currentCount++;
        if (this.repeatCount && this.currentCount >= this.repeatCount) {
            this.stop();
            this.dispatch('timer');
            this.dispatch('timerComplete');
            return;
        }
        this.dispatch('timer');
        this.loopTimer = setTimeout(function(self) {
            self.loop();
        }, this.interval, this);
    },
}


var async = {};

/*
 * sleep 的な処理
 */
async.wait = function(wait, flush) {
    if (typeof flush == 'undefined') flush = true;

    let endTime = Date.now() + wait;
    let mainThread = ThreadManager.mainThread;
    let c = 0;
    do {
        c++;
        mainThread.processNextEvent(flush);
    } while ( (flush && mainThread.hasPendingEvents()) || Date.now() < endTime );
    return c;
};

/*
 * nsIRunnable
 */
async.runnable = function async_runnable (self, func, args) {
    this.self = self;
    this.func = func;
    this.args = args;
}

async.runnable.prototype = {
    set thread(th) this._thread = th,
    get thread() {
        if (!this._thread) {
            this._thread = ThreadManager.newThread(0);
        }
        return this._thread;
    },
    run: function() {
        this.func.apply(this.self, this.args);
    },
    selfDispatch: function(pri) {
        let thread = this.thread;
        this.thread.dispatch(this, pri || thread.DISPATCH_NORMAL);
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIRunnable]),
}

async.method = function async_method (func, self, thread) {
    let args = Array.slice(arguments, 3);
    let runnable = new async.runnable(self, func, args);
    if (thread)
        runnable.thread = thread;
    runnable.selfDispatch();
    return runnable;
}

/*
 * 数万回ループ処理など、重い処理を yield で分割実行する。
 */
async.splitExecuter = function async_splitExecuter(it, loopTimes, callback, finishCallback) {
    let count = 0;
    loopTimes++;

    let totalLoop = 0;
    let iterator = Iterator(it);
    let generator = (function() {
        yield true;
        while (true) {
            if (++count % loopTimes) {
                try {
                    let n = iterator.next();
                    callback.call(this, n, totalLoop);
                } catch (e if e instanceof StopIteration) {
                    if (typeof finishCallback == 'function')
                        finishCallback(totalLoop - 1);
                    yield false;
                }
                totalLoop++;
            } else {
                count = 0;
                yield true;
            }
        }
    })();

    let looping = function() {
        if (generator.next()) {
            setTimeout(looping, 0);
        } else {
            generator.close();
        }
    }
    looping();
    return generator;
}
/*
 * end async
 */

/*
 * net
 */
var net = {};

net.makeQuery =  function net_makeQuery (data) {
    let pairs = [];
    let regexp = /%20/g;
    for (let k in data) {
        if (typeof data[k] == 'undefined') continue;
        let v = data[k].toString();
        let pair = encodeURIComponent(k).replace(regexp,'+') + '=' +
            encodeURIComponent(v).replace(regexp,'+');
        pairs.push(pair);
    }
    return pairs.join('&');
}

net.sync_get = function net__sync_get(url, query, method) {
    if (!method) method == 'GET';
    if (method == 'GET' && query) {
        let q = this.makeQuery(query);
        if (q) {
            url += '?' + q;
        }
    }
    let Y = function(func) {
        let g = func(function(t) {
            try { g.send(t) } catch (e) {};
        });
        return g;
    };
    let xhr;
    let gen = Y(function(next) {
        xhr = new XMLHttpRequest();
        xhr.mozBackgroundRequest = true;
        xhr.open('GET', url, false);
        if (method == 'POST') {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(this.makeQuery(query));
        } else {
            xhr.send(null);
        }
        yield xhr;
    });

    return gen.next();
}

net._http = function net__http (url, callback, errorback, async, query, method) {
    let xhr = new XMLHttpRequest();
    xhr.mozBackgroundRequest = true;
    if (async) {
       xhr.onreadystatechange = function() {
           if (xhr.readyState == 4) {
               if (xhr.status == 200) {
                   if (typeof callback == 'function')
                       callback(xhr);
               } else {
                   if (typeof errorback == 'function')
                       errorback(xhr);
               }
           }
       }
    }
    if (method == 'GET') {
        let q = this.makeQuery(query);
        if (q) {
            url += '?' + q;
        }
    }
    xhr.open(method, url, async);

    if (method == 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(this.makeQuery(query));
    } else {
        xhr.send(null);
        if (!async) {
            if (typeof callback == 'function')
                callback(xhr);
        }
    }
    return xhr;
}

net.get = function net_get (url, callback, errorback, async, query)
                this._http(url, callback, errorback, async, query, 'GET');

net.post = function net_post (url, callback, errorback, async, query)
                this._http(url, callback, errorback, async, query, 'POST');

/*
 * parseShortcut function copy from XUL/Migemo
 */
var parseShortcut = function parseShortcut(aShortcut) {
    var accelKey = navigator.platform.toLowerCase().indexOf('mac') == 0 ? 'meta' : 'ctrl' ;
    aShortcut = aShortcut.replace(/accel/gi, accelKey);

    var keys = aShortcut.split('+');

    var keyCode = keys[keys.length-1].replace(/ /g, '_').toUpperCase();
    var key     = keyCode;

    sotredKeyCode = (keyCode.length == 1 || keyCode == 'SPACE' || !keyCode) ? '' : 'VK_'+keyCode ;
    key = sotredKeyCode ? '' : keyCode ;

    return {
        key      : key,
        charCode : (key ? key.charCodeAt(0) : '' ),
        keyCode  : sotredKeyCode,
        altKey   : /alt/i.test(aShortcut),
        ctrlKey  : /ctrl|control/i.test(aShortcut),
        metaKey  : /meta/i.test(aShortcut),
        shiftKey : /shift/i.test(aShortcut),
        string   : aShortcut,
        modified : false
    };
}

var EXPORT = [m for (m in new Iterator(this, true))
                          if (m[0] !== "_" && m !== "EXPORT")];


