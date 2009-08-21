Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules();
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
                annotation: selector2xpath(paraInfos.container || 'parent'),
                annotationPosition: 'last',
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
    return selector.split(',').map(singleSelector2xpath).join(' | ');
}

function singleSelector2xpath(selector) {
    return 'descendant::' +
        selector.split(/([ >])/).map(selectorPart2xpath).join('');
}

function selectorPart2xpath(part, i) {
    if (i & 1) return (part === ' ') ? '/descendant::' : '/child::';

    let elementPart = /^(?:[\w-]+|\*)/.exec(part);
    let element;
    if (elementPart) {
        element = elementPart[0];
        part = part.substring(element.length);
    } else {
        element = '*';
    }
    return part
        ? element + '[' + part.split(/(?=[#.:])/).map(classes2xpath).join(' and ') + ']'
        : element;
}

function classes2xpath(kindOfClass) {
    let first = kindOfClass.charCodeAt(0);
    if (first === 35 /* '#' */)
        return '@id = "' + kindOfClass.substring(1) + '"';
    if (first === 46 /* '.' */)
        return 'contains(concat(" ", normalize-space(@class), " "), " ' +
               kindOfClass.substring(1) + ' ")';

    switch (kindOfClass) {
    case ':first-child':
    case ':first':
    case ':nth-child(1)':
        return 'not(preceding-sibling::*)';

    case':last-child':
        return 'not(following-sibling::*)';
    }
    // Assume it is an nth-child pseudo class.
    let index = (/\d+/.exec(kindOfClass) || [0])[0];
    return 'count(preceding-sibling::*) = ' + (index - 1);
}

function getLinkToCurrentURI(context) {
    let doc = context.ownerDocument || context;
    let a = doc.createElementNS(XHTML_NS, 'a');
    a.href = doc.defaultView.location.href;
    return a;
}

SiteInfoSet.converters.hatenastar = convertHatenaStarSiteConfigToSiteInfoItem;
