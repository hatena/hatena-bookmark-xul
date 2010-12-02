Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);
const EXPORTED_SYMBOLS = [];
//const EXPORTED_SYMBOLS = ['selector2xpath'];

function convertHatenaStarSiteConfigToSiteInfoItem(text) {
    let config = decodeJSON(text);
    let items = [];
    for (let domain in config) {
        let entries = config[domain];
        let domainPattern = '^https?://'
        domainPattern += (domain.charCodeAt(0) === 42 /* '*' */)
            ? '(?:[\w-]+\.)*' + domain.substring(2).replace(/\W/g, '\\$&')
            : domain.replace(/\W/g, '\\$&');
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            let path = entry.path || '';
            let urlPattern = domainPattern +
                             ((path.charCodeAt(0) === 94 /* '^' */)
                              ? path.substring(1)
                              : '.*' + path);
            let entryNodes = entry.entryNodes;
            if (!entryNodes) continue;
            let paraSelector;
            // 同一パス下での複数エントリには非対応
            for (paraSelector in entryNodes) break;
            let paraInfos = entryNodes[paraSelector];
            items.push({
                domain:     urlPattern,
                paragraph:  selector2xpath(paraSelector),
                link:       selector2xpath(paraInfos.uri || 'parent'),
                annotation: selector2xpath(paraInfos.container ||
                                           paraInfos.uri || 'parent'),
            });
        }
    }
    return items;
}

function selector2xpath(selector) {
    switch (selector) {
    case 'parent':
        return 'self::*';

    case 'window.location':
    case 'document.location':
        return getLinkToCurrentURI;

    //case 'document.title':
    //    return '""';
    }

    selector = selector.replace(/\s+/g, ' ').replace(/ ?([,>]) ?/g, '$1');
    return selector.replace(/(,)?([^,]+)/g, singleSelector2xpath);
}

function singleSelector2xpath(match, comma, selector) {
    return (comma ? ' | descendant::' : 'descendant::') +
        selector.replace(/([ >])?([^ >]+)/g, selectorPart2xpath);
}

function selectorPart2xpath(match, combinator, part) {
    let step = combinator ? ((combinator === ' ') ? '/descendant::' : '/child::') : ''
    let elementEnd = part.search(/[#.:]/);
    if (elementEnd === -1) return step + part;
    if (elementEnd) {
        step += part.substring(0, elementEnd);
        part = part.substring(elementEnd);
    } else {
        step += '*';
    }
    return step + '[' + part.replace(/([#.:])([\w-]+(?:\((\d+)\))?)/g, classes2xpath) + ']';
}

function classes2xpath(match, kind, name, index, offset) {
    let expr = offset ? ' and ' : '';
    if (kind === '#')
        return expr + '@id = "' + name + '"';
    if (kind === '.')
        return expr + 'contains(concat(" ", normalize-space(@class), " "), " ' + name + ' ")';

    switch (name) {
    case 'first-child':
    case 'first': // Someone specifies incorrect pseudo classes
    case 'nth-child(1)':
        return expr + 'not(preceding-sibling::*)';

    case 'last-child':
        return expr + 'not(following-sibling::*)';
    }
    // Assume it is an nth-child pseudo class.
    return expr + 'count(preceding-sibling::*) = ' + (index - 1 || -1);
}

function getLinkToCurrentURI(context) {
    let doc = context.ownerDocument || context;
    // XXX doesn't work in XHTML.
    let apLink = doc.evaluate(
        '(ancestor-or-self::*/preceding-sibling::*' +
            '[@class = "autopagerize_page_info" or @class = "_autopagerize"]' +
        ')[last()]/descendant::a[@class = "autopagerize_link" and @href]',
        context, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null
    ).singleNodeValue;
    let a = doc.createElementNS(XHTML_NS, 'a');
    a.href = apLink ? apLink.href : doc.defaultView.location.href;
    return a;
}

SiteInfoSet.converters.hatenastar = convertHatenaStarSiteConfigToSiteInfoItem;
