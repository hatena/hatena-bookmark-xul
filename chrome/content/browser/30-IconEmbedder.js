const EXPORT = ["IconEmbedder"];

function IconEmbedder(doc) {
    this.doc = doc;
    this.site = SiteInfoSet.LDRize.get(doc);
    if (this.site && !this.site.data.disable)
        this.ready();
}

IconEmbedder.STYLE = <![CDATA[
    .hBookmark-embedded-counter,
    .hBookmark-embedded-add-button {
        text-decoration: none;
        margin: 0 2px 0 4px;
    }
    .hBookmark-embedded-counter img,
    .hBookmark-embedded-add-button img {
        border: none;
        vertical-align: middle;
        -moz-force-broken-image-icon: 1;
    }
]]>.toString().replace(/\s+/g, " ");

extend(IconEmbedder.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/embed.properties"),
    isAutoPagerInstalled: !!getService("@mozilla.org/extensions/manager;1",
                                       Ci.nsIExtensionManager)
                              .getInstallLocation("autopager@mozilla.org"),

    ready: function IE_ready() {
        this.embedStyles();
        this.embed();
        this.doc.addEventListener("HB.PageInserted", this, false);
        this.doc.defaultView.addEventListener("GM_AutoPagerizeLoaded", this, false, true);
        if (this.isAutoPagerInstalled)
            this.doc.addEventListener("DOMNodeInserted", this, false);
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
            if (!(annotation instanceof Ci.nsIDOMRange)) {
                let range = this.doc.createRange();
                let position = this.site.data.annotationPosition ||
                    ((annotation instanceof Ci.nsIDOMHTMLAnchorElement ||
                      annotation instanceof Ci.nsIDOMHTMLBRElement ||
                      annotation instanceof Ci.nsIDOMHTMLHRElement ||
                      annotation instanceof Ci.nsIDOMHTMLImageElement ||
                      annotation instanceof Ci.nsIDOMHTMLCanvasElement ||
                      annotation instanceof Ci.nsIDOMHTMLObjectElement ||
                      annotation instanceof Ci.nsIDOMHTMLInputElement ||
                      annotation instanceof Ci.nsIDOMHTMLButtonElement ||
                      annotation instanceof Ci.nsIDOMHTMLSelectElement ||
                      annotation instanceof Ci.nsIDOMHTMLTextAreaElement)
                     ? 'after' : 'last');
                if (position === 'before' || position === 'after')
                    range.selectNode(annotation);
                else
                    range.selectNodeContents(annotation);
                range.collapse(position === 'before' || position === 'start');
                annotation = range;
            }
            let options = {
                embedCounter:   Prefs.bookmark.get("embed.counter") &&
                                !this.isCounterEmbedded(paragraph, link),
                embedAddButton: Prefs.bookmark.get("embed.addButton") &&
                                !this.isAddButtonEmbedded(paragraph, link),
                range:          annotation,
            };
            let icons = this.createIcons(link, options);
            annotation.insertNode(icons);
        }, this);
    },

    isCounterEmbedded: function IE_isCounterEmbedded(paragraph, link) {
        let oldEntryURL = B_HTTP + 'entry/' +
                          iri2uri(link.href).replace(/#/g, '%23');
        let xpath =
            'descendant::a[' +
            '    (@href = "' + entryURL(link.href) + '" or ' +
            '     @href = "' + oldEntryURL + '") and ' +
            '    (contains(., " users") or ' +
            '     img[starts-with(@src, "' + B_HTTP + 'entry/image/") or ' +
            '         starts-with(@src, "' + B_STATIC_HTTP + 'entry/image/")])' +
            ']';
        return this.doc.evaluate(xpath, paragraph, null,
                                 XPathResult.BOOLEAN_TYPE, null).booleanValue;
    },

    isAddButtonEmbedded: function IE_isAddButtonEmbedded(paragraph, link) {
        let xpath = 'descendant::a[@href = "' +
            B_HTTP + 'my/add.confirm/?url=' + escapeIRI(link.href) + '"]';
        return this.doc.evaluate(xpath, paragraph, null,
                                 XPathResult.BOOLEAN_TYPE, null).booleanValue;
    },

    createIcons: function IE_createIcons(link, options) {
        // Since Vimperator overrides XML settings, we override them again.
        let xmlSettings = XML.settings();
        XML.setSettings({ ignoreWhitespace: true });
        let icons = this.doc.createDocumentFragment();
        let space = this.doc.createTextNode(" ");
        let inNewTab = Prefs.bookmark.get("link.openInNewTab");
        if (options.embedCounter) {
            let counter =
                <a xmlns={ XHTML_NS }
                   class="hBookmark-embedded-counter"
                   href={ entryURL(link.href) }
                   title={ this.strings.get("showEntryTitle") }
                   style="display: none;">
                    <img src={ B_STATIC_HTTP + 'entry/image/' +
                               link.href.replace(/#/g, "%23") }
                         alt={ this.strings.get("showEntryText") }
                         onload="if (this.naturalWidth === 1)
                                     this.onerror();
                                 else
                                     this.parentNode.style.display = '';"
                         onerror="this.parentNode.parentNode.removeChild(this.parentNode);"/>
                </a>;
            if (inNewTab)
                counter.@target = "_blank";
            icons.appendChild(xml2dom(counter, options.range));
        }
        if (options.embedAddButton) {
            let addButton =
                <a xmlns={ XHTML_NS }
                   class="hBookmark-embedded-add-button"
                   href={ addPageURL(link.href) }
                   title={ this.strings.get("addBookmarkTitle") }>
                    <img src={ B_STATIC_HTTP + "images/append.gif" }
                         alt={ this.strings.get("addBookmarkText") }
                         width="16" height="12"
                         style="margin-top: 1px; /* Adjust height with counter */"/>
                </a>;
            if (inNewTab)
                addButton.@target = "_blank";
            icons.appendChild(xml2dom(addButton, options.range));
        }
        if (icons.firstChild) {
            icons.insertBefore(space.cloneNode(false), icons.firstChild);
            icons.appendChild(space.cloneNode(false));
        }
        XML.setSettings(xmlSettings);
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
