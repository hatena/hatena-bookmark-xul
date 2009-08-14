Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules();

const EXPORTED_SYMBOLS = [];

let builtInSiteInfo = [
    /*
    {
        domain:
                A regular expression that matches the URL of the target page
                or a string that express a regular expression pattern.
        paragraph:
                An XPath expression that mathes article parts of the page
                or a function that returns an array of elements.
        link:
                An XPath expression that matches a link that the article
                refers to or a function that returns a element.  This parameter
                is optional.  If you omit this, the article specified in
                paragraph is used.
        annotation:
                An XPath expression that matches an element where Hatena
                Bookmark widgets are inserted or a function that returns an
                element or a range.  This parameter is optional.  If you
                omit this, the link is used.
        annotationPosition:
                One of the strings: "before", "after", "first", "last".  This
                indicates the position where widgets are inserted, relative to
                the annotation element.  This parameter is optinal and the
                default value is "after" if the annotation element is a, br,
                hr, image, canvas, object, input, button, select, or textarea.
                Otherwise "last".  This is not used if annotation is a range.
        disable:
                If this is set to true, widgets are not embedded.
    },
    */

    { // Google Web Search
        domain:     /^http:\/\/www\.google(?:\.\w+){1,2}\/search\?/,
        // AutoPager insert <div id="res"> so we can't use id function.
        //paragraph:  'id("res")/div/ol/li[contains(concat(" ", @class, " "), " g ")]',
        paragraph:  'descendant::div[@id = "res"]/div/ol/li[contains(concat(" ", @class, " "), " g ")]',
        link:       'descendant::a[contains(concat(" ", @class, " "), "l")]',
        annotation: 'descendant::span[@class = "gl"]',
        annotationPosition: 'after',
    },
    { // Google News
        domain:     /^http:\/\/news\.google(?:\.\w+){1,2}\//,
        paragraph:  'descendant::div[contains(concat(" ", @class, " "), " story ")]',
        link:       'descendant::a[starts-with(concat(" ", @class), " usg-")]',
        annotation: 'descendant::div[contains(concat(" ", @class, " "), " sources ")]/*[contains(concat(" ", @class, " "), " moreLinks ") or not(following-sibling::*)]',
        annotationPosition: 'after',
    },
    { // Yahoo Web Search
        domain:     /^http:\/\/search\.yahoo(?:\.\w+){1,2}\/search\?/,
        paragraph:  'id("yschcont")/descendant::div[@class = "web"]',
        link: function (context) {
            let link = context.getElementsByClassName("yschttl")[0];
            if (!link || !link.href) return null;
            link = link.cloneNode(true);
            let match = link.href.match(/\/\*-(.+)/);
            try {
                link.href = decodeURIComponent(match[1]);
            } catch (ex) {
                return null;
            }
            return link;
        },
        annotation: 'descendant::div[@class = "sinf"]',
        annotationPosition: 'last',
    },
];

var evaluator = new XPathEvaluator();

function ldrizeMatcher(item, url, doc) {
    if (item._urlPattern)
        return item._urlPattern.test(url);
    if (item._xpath)
        return doc.evaluate(item._xpath, doc,
                            function () doc.lookupNamespaceURI(null) || "",
                            XPathResult.BOOLEAN_TYPE, null).booleanValue;
    if (item._matchFunction) {
        try {
            return item._matchFunction(url, doc);
        } catch (ex) {
            return false;
        }
    }
    if (item._isInvalid) return false;

    let key = item.domain;
    if (key) {
        if (key.constructor.name === "RegExp" ||
            /^\^?http(?:s\??)?:/.test(key)) {
            item._urlPattern = new RegExp(key);
            return ldrizeMatcher(item, url, doc);
        }
        if (typeof key === "function") {
            item._matchFunction = key;
            return ldrizeMatcher(item, url, doc);
        }
        try {
            doc.createExpression(key, null); // Check if XPath is valid
            item._xpath = addDefaultPrefix(key, "__default__");
            return ldrizeMatcher(item, url, doc);
        } catch (ex) {}
    }
    item._isInvalid = true;
    return false;
}

let LDRize = new SiteInfoSet({
    matcher: ldrizeMatcher,
    sources: [
        { file: 'LDRize.user.siteinfo.js' },
        { items: builtInSiteInfo },
        {
            file: 'LDRize.siteinfo.js',
            url: 'http://wedata.net/databases/LDRize/items.json',
            format: 'wedata',
            // XXX ToDo: create pref for this
            shouldUse: function () true || Prefs.bookmark.get("embed."),
        },
    ],
});

// For check
// try { alert(target.hBookmark.SiteInfoSet.LDRize.get(target.gBrowser.contentDocument).data.toSource()); } catch (ex) { Application.console.log(ex); }

SiteInfoSet.LDRize = LDRize;
