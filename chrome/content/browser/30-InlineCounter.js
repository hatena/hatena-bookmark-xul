const EXPORT = ["InlineCounter"];

const HB_NS = "http://b.hatena.ne.jp/";

function InlineCounter(doc) {
    this.doc = doc;
    this.site = SiteInfoSet.Paragraphs.get(doc);
    if (this.site)
        this.ready();
}

extend(InlineCounter.prototype, {
    ready: function IC_ready() {
        this.embed();
        this.doc.addEventListener("HB.PageInserted", this, false);
        this.doc.defaultView.addEventListener("GM_AutoPagerizeLoaded", this, false, true);
    },

    embed: function IC_embed() {
        this.site.queryAll("paragraph", this.doc).forEach(function (paragraph) {
            if (paragraph.hasAttributeNS(HB_NS, "counter")) return;
            paragraph.setAttributeNS(HB_NS, "hb:counter", "true");

            let link = this.site.query("link", paragraph, paragraph);
            if (!link.href) return;
            let annotation = this.site.query("annotation", paragraph, link);
            let container = annotation.parentNode;
            let anchor = annotation.nextSibling;
            switch (this.site.annotationPosition) {
            case "before":
                anchor = annotation;
                break;

            case "first":
                container = annotation;
                anchor = annotation.firstChild;
                break;

            case "last":
                container = annotation;
                anchor = null;
                break;

            case "after":
            default:
                break;
            }
            let counter = this.createCounter(link.href);
            container.insertBefore(counter, anchor);
        }, this);
    },

    createCounter: function IC_createCounter(url) {
        return xml2dom(
            <span xmlns={ XHTML_NS } class="hBookmark-inline-counter">
                <a href={ entryURL(url) }>
                    <img src={ B_HTTP + 'entry/image/' + url } alt="" style="border: none;"/>
                </a>
                <a href={ addPageURL(url) }>
                    <img src="http://b.hatena.ne.jp/images/append.gif" alt="" style="border: none;"/>
                </a>
            </span>,
            { document: this.doc, context: this.doc.body }
        );
    },

    getItem: function IC_getItem(key, context) {
        let path = this.site[key];
        if (!path) return null;
        return (typeof path === "function")
            ? path(context) : queryXPath(path, context);
    },

    getItems: function IC_getItem(key, context) {
        let path = this.site[key];
        if (!path) return [];
        return (typeof path === "function")
            ? path(context) : queryXPathAll(path, context);
    },

    handleEvent: function IC_handleEvent(event) {
        switch (event.type) {
        case "DOMNodeInserted":
            if ("isPage" in this.site.data &&
                !this.site.query("isPage", event.target, true))
                break;
            // fall through
        case "HB.PageInserted":
            this.embed();
            break;

        case "GM_AutoPagerizeLoaded":
            this.doc.addEventListener("DOMNodeInserted", this, false);
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
