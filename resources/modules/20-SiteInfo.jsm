Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");

const EXPORTED_SYMBOLS = ["SiteInfo", "SiteInfoSet"];

const DEFAULT_PREFIX = "__default__";
let evaluator = new XPathEvaluator();


function SiteInfo(data, url, doc) {
    this.data = data;
    this.url = url;
    // 念のため循環参照にならないよう弱参照で持つ
    // 本当に弱参照にしないといけないか (そうしないと
    // メモリリークが発生するか) は不明、未確認。
    this._win = doc.defaultView
                   .QueryInterface(Ci.nsISupportsWeakReference)
                   .GetWeakReference();
    this._isHTML = (doc.contentType === "text/html");
    this._exprs = {};
}

extend(SiteInfo.prototype, {
    get doc() let (w = this.win) w && w.document,
    get win() {
        try {
            return this._win.QueryReferent(Ci.nsIDOMWindow);
        } catch (ex) {
            return null;
        }
    },

    query: function SI_query(key, context, resultType) {
        context = context || this.doc;
        let expr = this._exprs[key];
        if (!expr) {
            expr = this.data[key];
            if (!expr) return null;
            if (typeof expr === "string") {
                if (!this._isHTML)
                    expr = addDefaultPrefix(expr, DEFAULT_PREFIX);
                try {
                    expr = evaluator.createExpression(expr, this);
                } catch (ex) {
                    return null;
                }
            }
            this._exprs[key] = expr;
        }
        if (typeof expr === "function")
            return expr.call(this, context, resultType);

        resultType = resultType || XPathResult.FIRST_ORDERED_NODE_TYPE;
        if (typeof resultType !== "number") {
            switch (resultType.name || String(resultType)) {
            case "Number":  resultType = XPathResult.NUMBER_TYPE;  break;
            case "String":  resultType = XPathResult.STRING_TYPE;  break;
            case "Boolean": resultType = XPathResult.BOOLEAN_TYPE; break;
            case "Array":
                resultType = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
                break;
            default:
                resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
            }
        }

        let result;
        try {
            result = expr.evaluate(context, resultType, null);
        } catch (ex) {
            return null;
        }
        switch (result.resultType) {
        case XPathResult.NUMBER_TYPE:  return result.numberValue;
        case XPathResult.STRING_TYPE:  return result.stringValue;
        case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
            return result;
        case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
        case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
            let nodes = [];
            for (let i = 0, n = result.snapshotLength; i < n; i++)
                nodes.push(result.snapshotItem(i));
            return nodes;
        case XPathResult.ANY_UNORDERED_NODE_TYPE:
        case XPathResult.FIRST_ORDERED_NODE_TYPE:
            return result.singleNodeValue;
        }
        return null;
    },

    queryAll: function SI_queryAll(key, context) {
        return this.query(key, context, Array) || [];
    },

    queryFirstString: function SI_queryFirstString(key, source) {
        let expr = this._exprs[key];
        if (!expr) {
            expr = this.data[key];
            if (typeof expr === "string")
                expr = new RegExp(expr);
            this._exprs[key] = expr;
        }
        if (typeof expr === "function" && expr.call)
            return expr.call(this, source);

        let match = expr.exec(source);
        if (!match) return null;
        for (let i = 1; i < match.length; i++)
            if (match[i])
                return match[i];
        return match[0];
    },

    lookupNamespaceURI: function SI_lookupNamespaceURI(prefix) {
        return (prefix === DEFAULT_PREFIX)
            ? this.doc.lookupNamespaceURI(null)
            : this.doc.lookupNamespaceURI(prefix);
    },
});


function SiteInfoSet(options) {
    this.matcher = options.matcher; // matcher: (siteinfo, url, doc) -> boolean
    this.sources = [];
    (options.sources || []).forEach(this.insertSource, this);
    SiteInfoSet._instances.push(this);
}

extend(SiteInfoSet.prototype, {
    dispose: function SIS_dispose() {
        this.matcher = null;
        this.sources = null;
        let i = SiteInfoSet._instances.indexOf(this);
        if (i !== -1)
            SiteInfoSet._instances.splice(i, 1);
    },

    insertSource: function SIS_insertSource(source, index) {
        source = extend({ updated: 0, items: [], format: '' }, source);
        if (source.file && !source.fileObject) {
            let file = DirectoryService.get('ProfD', Ci.nsIFile);
            file.append('hatenabookmark');
            if (!file.exists())
                file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
            file.append(source.file);
            source.fileObject = file;
        }
        this._refreshSource(source);
        this._fetchSource(source);
        if (typeof index === 'undefined' || index < 0)
            this.sources.push(source);
        else
            this.sources.splice(index, 0, source);
    },

    update: function SIS_update(forceUpdate) {
        this.sources.forEach(function (source) {
            if (forceUpdate)
                this._refreshSource(source);
            this._fetchSource(source, forceUpdate);
        }, this);
    },

    get: function SIS_get(doc) {
        if (!doc) return null;
        let url = doc.defaultView.location.href;
        let matcher = this.matcher;
        for (let i = 0; i < this.sources.length; i++) {
            let source = this.sources[i];
            if (source.shouldUse && !source.shouldUse()) continue;
            let items = source.items;
            if (!items) continue;
            for (let j = 0; j < items.length; j++) {
                if (matcher(items[j], url, doc))
                    return new SiteInfo(items[j], url, doc);
            }
        }
        return null;
    },

    _refreshSource: function SIS__refreshSource(source) {
        if (!source.fileObject || !source.fileObject.exists()) return;
        let loader = getService('@mozilla.org/moz/jssubscript-loader;1',
                                Ci.mozIJSSubScriptLoader);
        let handler = getService('@mozilla.org/network/protocol;1?name=file',
                                 Ci.nsIFileProtocolHandler);
        let url = handler.getURLSpecFromFile(source.fileObject);
        let data = null;
        try {
            data = loader.loadSubScript(url);
            p('SiteInfoSet#_refreshSource: read from ' + source.fileObject.path);
        } catch (ex) {}
        [source.items, source.updated] = this._getItemsAndUpdated(data);
    },

    _writeSource: function SIS__writeSource(source) {
        if (!source.fileObject) return;
        let stream = Cc['@mozilla.org/network/file-output-stream;1'].
                     createInstance(Ci.nsIFileOutputStream);
        // We assume that the result of toSource() is an ASCII string.
        let data = { updated: source.updated, items: source.items }.toSource();
        try {
            stream.init(source.fileObject, 0x02 | 0x08 | 0x20, 0644, 0);
            stream.write(data, data.length);
            p('SiteInfoSet#_writeSource: written to ' + source.fileObject.path)
        } catch (ex) {
        } finally {
            stream.close();
        }
    },

    _fetchSource: function SIS__fetchSource(source, forceFetch) {
        if (!source.urls && !source.url) return;
        let updateInterval = PrefService.getIntPref('extensions.hatenabookmark.embed.siteInfoUpdateInterval') * 1000;
        if (!forceFetch && source.updated + updateInterval > Date.now()) return;
        let urls = [].concat(source.urls || source.url);
        this._doFetchSource(source, urls);
    },

    _doFetchSource: function SIS__doFetchSource(source, urls) {
        p('SiteInfoSet#_doFetchSource')
        let url = urls.shift();
        let xhr = new XMLHttpRequest();
        xhr.mozBackgroundRequest = true;
        xhr.open('GET', url);
        xhr.setRequestHeader('If-Modifield-Since',
                             new Date(source.updated).toUTCString());
        xhr.addEventListener('load', onFetch, false);
        xhr.addEventListener('error', onFetch, false);
        xhr.send(null);
        let timer = new BuiltInTimer({ observe: onTimeout }, 60 * 1000,
                                     Ci.nsITimer.TYPE_ONE_SHOT);

        let self = this;
        function onFetch(event) {
            p('SiteInfoSet#_doFetchSource onFetch: [' + event.type + '] ' + url);
            let succeeded = false;
            if (event.type === 'load') {
                if (xhr.status === 200) {
                    if (xhr.responseText) {
                        [source.items, source.updated] =
                            self._getItemsAndUpdated(xhr.responseText,
                                                     source.format);
                        succeeded = true;
                    }
                } else if (xhr.status === 304) {
                    self.updated = Date.now();
                    succeeded = true;
                }
            }
            if (succeeded)
                self._writeSource(source);
            else if (urls.length)
                self._doFetchSource(source, urls);
            xhr.removeEventListener('load', onFetch, false);
            xhr.removeEventListener('error', onFetch, false);
            xhr = null;
        }

        function onTimeout() {
            if (xhr) {
                xhr.abort();
                onFetch({ type: 'timeout' });
            }
            timer.cancel();
            timer = null;
        }
    },

    _getItemsAndUpdated: function SIS__getItemsAndUpdated(rawData, format) {
        if (typeof rawData === 'string') {
            if (!(format in SiteInfoSet.converters))
                format = 'wedata';
            return [SiteInfoSet.converters[format](rawData), Date.now()];
        }
        if (Object.prototype.toString.call(rawData) === '[object Array]') {
            let items = (rawData.length && typeof rawData[0].data === 'object')
                        ? rawData.map(function (i) i.data) : rawData;
            return [items, Date.now()];
        }
        rawData = rawData || {};
        return [rawData.items || [], rawData.updated || Date.now()];
    },
});

extend(SiteInfoSet, {
    _instances: [],
    _timer: null,

    onTimer: function SIS_s_onTimer() {
        this._instances.forEach(function (set) set.update());
    },

    startObserving: function SIS_s_startObserving() {
        this._timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
        this._timer.init(this.observer, 10 * 60 * 1000, Ci.nsITimer.TYPE_REPEATING_SLACK);
        ObserverService.addObserver(this.observer, 'quit-application', false);
    },

    stopObserving: function SIS_s_stopObserving() {
        this._timer.cancel();
        this._timer = null;
        ObserverService.removeObserver(this.observer, 'quit-application');
        this._instances.length = 0;
    },

    observer: {
        observe: function (subject, topic, data) {
            switch (topic) {
            case 'timer-callback':
                SiteInfoSet.onTimer();
                break;
            case 'quit-application':
                SiteInfoSet.stopObserving();
                break;
            }
        },
    },

    createURLMatcher: function SIS_s_createURLMatcher(key) {
        return function SIS_urlMatcher(item, url) {
            let pattern = item._urlPattern;
            if (!pattern) {
                pattern = item[key];
                if (typeof pattern === 'string')
                    pattern = new RegExp(pattern);
                item._urlPattern = pattern;
            }
            return pattern.test(url);
        };
    },

    converters: {
        wedata: function SIS_wedata_converter(text) {
            let items = decodeJSON(text) || [];
            if (items.length && typeof items[0].data === 'object')
                items = items.map(function (i) i.data);
            return items;
        },
    },
});

SiteInfoSet.startObserving();
