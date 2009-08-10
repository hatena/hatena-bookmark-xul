Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");

const EXPORTED_SYMBOLS = ["SiteInfo", "SiteInfoSet2", "SiteInfoSet"];

const DEFAULT_PREFIX = "__default__";
let evaluator = new XPathEvaluator();


function SiteInfo(item, doc) {
    this.item = item;
    this.data = item.data;
    this._doc = doc;
    this._isHTML = (doc.contentType === "text/html");
    this._exprs = {};
}

extend(SiteInfo.prototype, {
    get doc SI_get_doc() this._doc,
    get win SI_get_win() this._doc.defaultView,

    query: function SI_query(key, context, resultType) {
        context = context || this._doc;
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
        return this.query(key, context, Array);
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
            ? this._doc.lookupNamespaceURI(null)
            : this._doc.lookupNamespaceURI(prefix);
    },
});


function SiteInfoSet2(options) {
    this.matcher = options.matcher; // matcher: (siteinfo, url, doc) -> boolean
    this.sources = [];
    (options.sources || []).forEach(this.insertSource, this);
}

extend(SiteInfoSet2.prototype, {
    insertSource: function SIS_insertSource(source, index) {
        source = extend({ updated: 0 }, source);
        if (typeof index === 'undefined' || index < 0)
            index = this.sources.length;
        if (source.file) {
            let file = source.file;
            if (!(file instanceof Ci.nsIFile)) {
                file = DirectoryService.get('ProfD', Ci.nsIFile);
                file.append('hatenabookmark');
                if (!file.exists())
                    file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
                file.append(source.file);
                source.file = file;
            }
            this._refreshSource(source);
        }
        if (source.data)
            source.items = source.data.map(function (d) ({ data: d }));
        if (source.url)
            this._fetchSource(source);
        this.sources.splice(index, 0, source);
    },

    update: function SIS_update(forceUpdate) {
        this.sources.forEach(function (source) {
            if (source.data)
                source.items = source.data.map(function (d) ({ data: d }));
            if (source.file)
                this._refreshSource(source);
            if (source.url)
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
                    return new SiteInfo(items[j], doc);
            }
        }
        return null;
    },

    _refreshSource: function SIS__refreshSource(source) {
        if (!source.file || !(source.file instanceof Ci.nsIFile) ||
            !source.file.exists())
            return;
        let loader = getService('@mozilla.org/moz/jssubscript-loader;1',
                                Ci.mozIJSSubScriptLoader);
        let handler = getService('@mozilla.org/network/protocol;1?name=file',
                                 Ci.nsIFileProtocolHandler);
        let url = handler.getURLSpecFromFile(source.file);
        let newSource;
        try {
            newSource = loader.loadSubScript(url);
        } catch (ex) {
            newSource = { updated: 0, items: [] };
        }
        if (!newSource) return;
        if (newSource.constructor.name === 'Array') {
            newSource = {
                updated: 0,
                items: newSource.map(function (d) ({ data: d })),
            };
        }
        source.updated = newSource.updated;
        source.items = newSource.items;
    },

    _writeSource: function SIS__writeSource(source) {
        if (!source.file) return;
        let stream = Cc['@mozilla.org/network/file-output-stream;1'].
                     createInstance(Ci.nsIFileOutputStream);
        stream.init(source.file, 0x02 | 0x08 | 0x20, 0644, 0);
        // The result of toSource() will be ASCII string.
        let data = { updated: source.updated, items: source.items }.toSource();
        stream.write(data, data.length);
        stream.close();
    },

    _fetchSource: function SIS__fetchSource(source, forceFetch) {
        let checkInterval = 24 * 60 * 60 * 1000; // XXX ToDo: to prefs
        if (!forceFetch && source.updated + checkInterval > Date.now()) return;
        p('SiteInfoSet#_fetchSource: begin fetch')
        let xhr = new XMLHttpRequest();
        xhr.open('GET', source.url);
        xhr.setRequestHeader('If-Modifield-Since',
                             new Date(source.updated).toUTCString());
        let self = this;
        xhr.addEventListener('load', function SIS_onFetch() {
            p('SiteInfoSet#_fetchSource: loaded')
            let items = decodeJSON(xhr.responseText);
            if (!items) return;
            source.updated = Date.now();
            source.items = items;
            self._writeSource(source);
        }, false);
        xhr.send(null);
    },
});

SiteInfoSet2.createURLMatcher = function SIS_s_createURLMatcher(key) {
    return function SIS_urlMatcher(item, url) {
        let pattern = item.urlPattern;
        if (!pattern) {
            pattern = item.data[key];
            if (typeof pattern === "string")
                pattern = new RegExp(pattern);
            item.urlPattern = pattern;
        }
        return pattern.test(url);
    };
};


function SiteInfoSet(urlKey) {
    this.urlKey = urlKey;
    this.items = [];
}

extend(SiteInfoSet.prototype, {
    addItems: function SIS_addItems(items) {
        this.items = this.items.concat(items);
    },

    addData: function SIS_addData(data) {
        let items = [].concat(data).map(function (d) ({ data: d }));
        this.addItems(items);
    },

    clearItems: function SIS_clearItems() {
        this.items = [];
    },

    get: function SIS_get(doc) {
        if (!doc) return null;
        let url = doc.defaultView.location.href;
        doc.defaultView.location.href;
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            let pattern = item.urlPattern;
            if (!pattern) {
                pattern = item.data[this.urlKey];
                if (typeof pattern === "string")
                    pattern = new RegExp(pattern);
                item.urlPattern = pattern;
            }
            if (pattern.test(url))
                return new SiteInfo(item, doc);
        }
        return null;
    },
});
