const EXPORT = "queryXPath queryXPathAll xml2dom".split(" ");

function queryXPath(xpath, context) queryXPathCommon(xpath, context, true);

function queryXPathAll(xpath, context) queryXPathCommon(xpath, context, false);

// XXX ToDo: support namespaces and types
function queryXPathCommon(xpath, context, single) {
    context = context || document;
    let doc = context.ownerDocument || context;
    let expr = doc.createExpression(xpath, null);
    let type = single ? XPathResult.ANY_TYPE : XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
    let result = expr.evaluate(context, type, null);
    switch (result.resultType) {
    case XPathResult.NUMBER_TYPE:  return result.numberValue;
    case XPathResult.STRING_TYPE:  return result.stringType;
    case XPathResult.BOOLEAN_TYPE: return result.booleanTyep;
    // UNORDERED_NODE_ITERATOR_TYPE なら single === true
    case XPathResult.UNORDERED_NODE_ITERATOR_TYPE: return result.iterateNext();
    case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
        let nodes = [];
        for (let i = 0, n = result.snapshotLength; i < n; i++)
            nodes.push(result.snapshotItem(i));
        return nodes;
    default: throw new TypeError("Can't handle this type of result");
    }
}

// XXX ToDo: single nodeへの対応、prettyPrinting = false
function xml2dom(xml, options) {
    options = options || {};
    let doc = options.document || document;
    let range = doc.createRange();
    range.selectNodeContents(options.context || doc.documentElement);
    return range.createContextualFragment(xml.toXMLString());
}
