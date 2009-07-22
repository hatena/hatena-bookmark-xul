const EXPORT = ["IconEmbedder"];

const HB_NS = "http://b.hatena.ne.jp/";

function IconEmbedder(doc) {
    this.doc = doc;
    this.site = SiteInfoSet.Paragraphs.get(doc);
    if (this.site && !this.site.data.disabled)
        this.ready();
}

IconEmbedder.STYLE = <![CDATA[
    .hBookmark-embedded-counter,
    .hBookmark-embedded-add-button {
        text-decoration: none;
        margin: 0 3px;
    }
    .hBookmark-embedded-counter img,
    .hBookmark-embedded-add-button img {
        border: none;
        vertical-align: text-bottom;
        -moz-force-broken-image-icon: 1;
    }
]]>.toString().replace(/\s+/g, " ");

extend(IconEmbedder.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/embed.properties"),

    ready: function IE_ready() {
        this.embedStyles();
        this.embed();
        this.doc.addEventListener("HB.PageInserted", this, false);
        this.doc.defaultView.addEventListener("GM_AutoPagerizeLoaded", this, false, true);
    },

    embedStyles: function IE_embedStyles() {
        let style = this.doc.createElementNS(XHTML_NS, "style");
        style.setAttribute("type", "text/css");
        style.textContent = IconEmbedder.STYLE;
        let head = this.doc.getElementsByTagName("head")[0];
        if (!head) return;
        head.appendChild(style);
    },

    embed: function IE_embed() {
        this.site.queryAll("paragraph").forEach(function (paragraph) {
            if (paragraph.hasAttributeNS(HB_NS, "annotation")) return;
            paragraph.setAttributeNS(HB_NS, "hb:annotation", "true");

            let link = this.site.query("link", paragraph) || paragraph;
            if (!link.href) return;
            let annotation = this.site.query("annotation", paragraph) || link;
            let container = annotation.parentNode;
            let anchor = annotation.nextSibling;
            switch (this.site.data.annotationPosition) {
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
            let icons = this.createIcons(link, paragraph);
            container.insertBefore(icons, anchor);
        }, this);
    },

    createIcons: function IE_createIcons(link, paragraph) {
        let icons = this.doc.createDocumentFragment();
        let space = this.doc.createTextNode(" ");
        let inNewTab = Prefs.bookmark.get("link.openInNewTab");
        let xml2domOptions = { document: this.doc, context: paragraph };
        if (Prefs.bookmark.get("embed.counter")) {
            let counter =
                <a xmlns={ XHTML_NS }
                   class="hBookmark-embedded-counter"
                   href={ entryURL(link.href) }
                   title={ this.strings.get("showEntryTitle") }
                   style="display: none;">
                    <img src={ B_STATIC_HTTP + 'entry/image/' + link.href }
                         alt={ this.strings.get("showEntryText") }
                         onload="if (this.naturalWidth === 1)
                                     this.onerror();
                                 else
                                     this.parentNode.style.display = '';"
                         onerror="this.parentNode.parentNode.removeChild(this.parentNode);"/>
                </a>;
            if (inNewTab)
                counter.@target = "_blank";
            icons.appendChild(xml2dom(counter, xml2domOptions));
        }
        if (Prefs.bookmark.get("embed.addButton")) {
            let addButton =
                <a xmlns={ XHTML_NS }
                   class="hBookmark-embedded-add-button"
                   href={ addPageURL(link.href) }
                   title={ this.strings.get("addBookmarkTitle") }>
                    <img src="http://b.hatena.ne.jp/images/append.gif"
                         alt={ this.strings.get("addBookmarkText") }
                         width="16" height="12"
                         style="margin-top: 1px; /* Adjust height with counter */"/>
                </a>;
            if (inNewTab)
                addButton.@target = "_blank";
            icons.appendChild(xml2dom(addButton, xml2domOptions));
        }
        if (icons.firstChild) {
            icons.insertBefore(space.cloneNode(false), icons.firstChild);
            icons.appendChild(space.cloneNode(false));
        }
        return icons;
    },

    handleEvent: function IE_handleEvent(event) {
        switch (event.type) {
        case "DOMNodeInserted":
            if ("isPage" in this.site.data &&
                !this.site.query("isPage", event.target, Boolean))
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


function tryToEmbedIcons(event) {
    if (Prefs.bookmark.get("embed.enabled") &&
        event.target instanceof HTMLDocument)
        new IconEmbedder(event.target);
}

window.addEventListener("load", function IconEmbedder_BEGIN() {
    gBrowser.addEventListener("DOMContentLoaded", tryToEmbedIcons, false);
}, false);
