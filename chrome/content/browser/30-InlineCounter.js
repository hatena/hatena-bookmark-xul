const EXPORT = ["InlineCounter"];

function InlineCounter(doc) {
    this.doc = doc;
    this.site = InlineCounter.getSite(doc.defaultView.location.href);
    if (!this.site) return;
    this.ready();
}

extend(InlineCounter, {
    getSite: function IC_s_getSite(url) {
        let sites = InlineCounter.sites;
        let site = null;
        for (let i = 0; i < sites.length; i++) {
            if (sites[i].url.test(url)) {
                site = sites[i];
                extend(site, InlineCounter.defaultSite, false);
                break;
            }
        }
        return site;
    },

    sites: [
        {
            url:     /^http:\/\/www\.google(?:\.\w+){1,2}\/search\?/,
            page:    'id("res")/div[ol]',
            article: 'ol/li[contains(concat(" ", @class, " "), " g ")]',
            link:    'h3/a',
            insertionPoint: 'div/cite/following-sibling::*[1]',
            isPage:  'self::div[ol and parent::div[@id = "res"]]'
        },
    ],

    defaultSite: {
        page:    'descendant::body',
        article: 'descendant::a[@href]',
        link:    '.',
        insertionPoint: function (node) {
            let range = node.ownerDocument.createRange();
            range.setStartAfter(node);
            range.collapse(true);
            return range;
        }
    }
});

extend(InlineCounter.prototype, {
    ready: function IC_ready() {
        let page = this.getItem("page", this.doc);
        if (!page) return;
        this.embedIn(page);
        if (this.site.isPage)
            this.doc.addEventListener("DOMNodeInserted", this, false);
    },

    embedIn: function IC_embedIn(page) {
        this.getItems("article", page).forEach(function (article) {
            let link = this.getItem("link", article);
            let insertionPoint = this.getItem("insertionPoint", article);
            if (!link || !insertionPoint) return;
            if (link.href)
                link = link.href;
            if (!/^https?:\/\//.test(link)) return;
            if (insertionPoint instanceof Node) {
                let range = insertionPoint.ownerDocument.createRange();
                range.setStartBefore(insertionPoint);
                range.collapse(true);
                insertionPoint = range;
            }
            let counter = this.createCounter(link);
            insertionPoint.insertNode(counter);
        }, this);
    },

    createCounter: function IC_createCounter(url) {
        return xml2dom(
            <span xmlns={ XHTML_NS } class="hBookmark-inline-counter">
                <a href={ entryURL(url) }>
                    <img src={ B_HTTP + 'entry/image/' + url } alt="" style="border: none;"/>
                </a>
            </span>,
            { document: this.doc, context: this.doc.body }
        );
    },

    getItem: function IC_getItem(key, context) {
        let path = this.site[key];
        return (typeof path === "function")
            ? path(context) : queryXPath(path, context);
    },

    getItems: function IC_getItem(key, context) {
        let path = this.site[key];
        return (typeof path === "function")
            ? path(context) : queryXPathAll(path, context);
    },

    handleEvent: function IC_handleEvent(event) {
        switch (event.type) {
        case "DOMNodeInserted":
            if (this.getItem("isPage", event.target))
                this.embedIn(event.target);
            break;
        }
    }
});


function tryToEmbedCounter(event) {
    if (Prefs.bookmark.get("inlineCounter.enabled") &&
        event.target instanceof HTMLDocument)
        new InlineCounter(event.target);
}

window.addEventListener("load", function InlineCounter_BEGIN() {
    gBrowser.addEventListener("DOMContentLoaded", tryToEmbedCounter, false);
}, false);
