Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");

const EXPORTED_SYMBOLS = ["SiteInfo", "SiteInfoSet"];

const DEFAULT_PREFIX = "__default__";
let evaluator = new XPathEvaluator();


// XXX To be moved to the independent module.
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


function SiteInfo(item, doc) {
    this.item = item;
    this.data = item.data;
    this._doc = doc;
    this._isHTML = (doc.contentType === "text/html");
    this._exprs = {};
}

extend(SiteInfo.prototype, {
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

    lookupNamespaceURI: function SI_lookupNamespaceURI(prefix) {
        return (prefix === DEFAULT_PREFIX)
            ? this._doc.lookupNamespaceURI(null)
            : element.lookupNamespaceURI(prefix);
    },
});


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
