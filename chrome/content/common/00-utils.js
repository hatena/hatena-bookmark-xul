
const EXPORT = ['newURI', 'async', 'net', 'sprintf', 'utils'];

function newURI(uriSpec, originCharset, baseURI) {
    if (typeof baseURI === "string")
        baseURI = IOService.newURI(baseURI, null, null);
    return IOService.newURI(uriSpec, originCharset, baseURI);
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

var sprintf = function (str) {
    let args = Array.slice(arguments, 1);
    return str.replace(/%[sdf]/g, function(m) _SPRINTF_HASH[m](args.shift()));
};

/*
 * グローバル関数としてエクスポートはしないけど、あったら便利な関数など
 */
var utils = {};
utils.keys = function(obj) [key for (key in obj)];
utils.values = function(obj) [key for each (key in obj)];
// utils.values = function(obj) return [value for each ((_,value) in Iterator(obj))];

var async = {};

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

net._http = function net__http (url, callback, errorback, async, query, method) {
    let xhr = new XMLHttpRequest();
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

net.post = function net_get (url, callback, errorback, async, query)
                this._http(url, callback, errorback, async, query, 'POST');



