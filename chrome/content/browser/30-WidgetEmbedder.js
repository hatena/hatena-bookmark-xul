const EXPORT = ["WidgetEmbedder", "IconEmbedder"];

var getEntryURL = entryURL;
var getAddPageURL = addPageURL;

function WidgetEmbedder(doc) {
    this.site = SiteInfoSet.Article.get(doc);
    if (!this.site || this.site.data.disable) return;
    this.embedStyle(doc);
    this.doc = null;
    let pref = Prefs.bookmark;
    this._inNewTab = pref.get("link.openInNewTab");
    this._embedCounter = pref.get("embed.counter");
    this._embedComments = pref.get("embed.comments");
    this._embedAddButton = pref.get("embed.addButton");
    this._timerId = doc.defaultView.setTimeout(this.onTimer, WidgetEmbedder.INITIAL_DELAY, this);
    doc.addEventListener("GM_AutoPagerizeLoaded", this, false, true);
    doc.addEventListener("HB.PageInserted", this, false, true);
    doc.addEventListener("DOMNodeInserted", this, false);
}

const embedStrings =
    new Strings("chrome://hatenabookmark/locale/embed.properties");


extend(WidgetEmbedder, {
    INITIAL_DELAY:  50,
    MUTATION_DELAY: 350,

    IMAGE_API_PREFIX: B_STATIC_HTTP + 'entry/image/',
    ADD_BUTTON_URL:   B_STATIC_HTTP + 'images/append.gif',

    STRING_SHOW_ENTRY_TITLE:   embedStrings.get('showEntryTitle'),
    STRING_SHOW_ENTRY_TEXT:    embedStrings.get('showEntryText'),
    STRING_ADD_BOOKMARK_TITLE: embedStrings.get('addBookmarkTitle'),
    STRING_ADD_BOOKMARK_TEXT:  embedStrings.get('addBookmarkText'),

    STYLE: <![CDATA[
        .hBookmark-widget {
            text-decoration: none !important;
            margin: 0 0 0 2px;
            border: none !important;
            display: inline !important;
        }
        .hBookmark-widget > img {
            border: none;
            vertical-align: middle;
            -moz-force-broken-image-icon: 1;
        }
    ]]>.toString(),
});

extend(WidgetEmbedder.prototype, {
    embedStyle: function WE_embedStyle(doc) {
        let style = doc.createElementNS(XHTML_NS, "style");
        style.setAttribute("type", "text/css");
        style.textContent = WidgetEmbedder.STYLE + (this.site.data.style || "");
        let head = doc.getElementsByTagName("head").item(0);
        if (!head) return;
        head.appendChild(style);
    },

    embed: function WE_embed() {
        //p('WidgetEmbedder#embed on ' + this.site.url);
        this.doc = this.site.doc;
        this.site.queryAll("paragraph", this.doc)
                 .forEach(this.embedInParagraph, this);
        this.doc = null;
    },

    embedInParagraph: function WE_embedInParagraph(paragraph) {
        if (paragraph.hasAttributeNS(HB_NS, "annotation")) return;
        paragraph.setAttributeNS(HB_NS, "hb:annotation", "true");

        let link = this.site.query("link", paragraph) || paragraph;
        if (!link.href || !/^https?:\/\//.test(link.href)) return;
        let points = this.getInsertionPoints(paragraph, link);
        let xmls = this.createWidgetXMLs(link);
        let space = this.doc.createTextNode(" ");
        let fragment = this.doc.createDocumentFragment();
        fragment.appendChild(space.cloneNode(false));

        let counter = null, comments = null;
        if (points.addButton) {
            let f = fragment.cloneNode(true);
            f.appendChild(xml2dom(xmls[2], points.addButton));
            f.appendChild(space.cloneNode(false));
            points.addButton.insertNode(f);
        }
        if (points.comments) {
            if (!points.counter)
                delete xmls[1].@style;
            comments = xml2dom(xmls[1], points.comments);
            comments.setAttributeNS(HB_NS, "hb:url", link.href);
            let f = fragment.cloneNode(true);
            f.appendChild(comments);
            if (points.comments !== points.addButton)
                f.appendChild(space.cloneNode(false));
            points.comments.insertNode(f);
        }
        if (points.counter) {
            counter = xml2dom(xmls[0], points.counter);
            let img = counter.firstChild;
            img.addEventListener("load", onCounterEvent, false);
            img.addEventListener("error", onCounterEvent, false);
            img.addEventListener("abort", onCounterEvent, false);
            let f = fragment.cloneNode(true);
            f.appendChild(counter);
            if (points.counter !== points.comments)
                f.appendChild(space.cloneNode(false));
            points.counter.insertNode(f);
        }

        function onCounterEvent(event) {
            let target = event.target;
            if (event.type === "load" && target.naturalWidth !== 1) {
                counter.removeAttribute("style");
                if (comments)
                    comments.removeAttribute("style");
            }
            target.removeEventListener("load", onCounterEvent, false);
            target.removeEventListener("error", onCounterEvent, false);
            target.removeEventListener("abort", onCounterEvent, false);
        }
    },

    getInsertionPoints: function WE_getInsertionPoints(paragraph, link) {
        let existings = this.getExistingWidgets(paragraph, link);
        let counterPoint = null, commentsPoint = null, addButtonPoint = null;
        if (!existings.counter) {
            let anchor = existings.entry ||
                         existings.comments ||
                         existings.addButton;
            if (anchor) {
                counterPoint = this.doc.createRange();
                counterPoint.selectNode(anchor);
                counterPoint.collapse(anchor !== existings.entry);
            } else {
                counterPoint = this.getAnnotationPoint(paragraph, link);
            }
        }
        if (!existings.comments) {
            if (existings.counter) {
                commentsPoint = this.doc.createRange();
                commentsPoint.selectNode(existings.counter);
                commentsPoint.collapse(false);
            } else {
                commentsPoint = counterPoint;
            }
        }
        if (!existings.addButton) {
            if (existings.comments) {
                addButtonPoint = this.doc.createRange();
                addButtonPoint.selectNode(existings.comments);
                addButtonPoint.collapse(false);
            } else {
                addButtonPoint = commentsPoint;
            }
        }
        return {
            counter:   this._embedCounter   ? counterPoint   : null,
            comments:  this._embedComments  ? commentsPoint  : null,
            addButton: this._embedAddButton ? addButtonPoint : null,
        };
    },

    getExistingWidgets: function WE_getExistingWidgets(paragraph, link) {
        const url = iri2uri(link.href);
        const escapedURL = encodeURIComponent(url);
        const entryURL    = getEntryURL(link.href);
        const oldEntryURL = B_HTTP + 'entry/' + url.replace(/#/g, '%23');
        const imageAPIPrefix    = B_STATIC_HTTP + 'entry/image/';
        const oldImageAPIPrefix = B_HTTP + 'entry/image/';
        const addURL    = getAddPageURL(link.href);
        const oldAddURL = B_HTTP + 'append?' + escapedURL;
        const entryImagePrefix = 'http://d.hatena.ne.jp/images/b_entry';
        let widgets = {
            entry:     null,
            counter:   null,
            comments:  null,
            addButton: null,
        };
        Array.forEach(paragraph.getElementsByTagName('a'), function (a) {
            switch (a.href) {
            case entryURL:
            case oldEntryURL:
                let content = a.firstChild;
                if (!content) break;
                if (content.nodeType === Node.TEXT_NODE) {
                    if (content.nodeValue.indexOf(' user') !== -1) {
                        widgets.counter = a;
                        break;
                    }
                    if (!content.nextSibling) break;
                    content = content.nextSibling;
                }
                if (content instanceof Ci.nsIDOMHTMLImageElement) {
                    let src = content.src;
                    if (src.indexOf(imageAPIPrefix) === 0 ||
                        src.indexOf(oldImageAPIPrefix) === 0)
                        widgets.counter = a;
                    else if (src.indexOf(entryImagePrefix) === 0)
                        widgets.entry = a;
                }
                break;

            case addURL:
            case oldAddURL:
                widgets.addButton = a;
                break;
            }
        });
        widgets.comments = paragraph.getElementsByClassName("hatena-bcomment-view-icon").item(0);
        return widgets;
    },

    getAnnotationPoint: function WE_getAnnotationPoint(paragraph, link) {
        let annotation = this.site.query("annotation", paragraph) || link;
        if (annotation instanceof Ci.nsIDOMRange) return annotation;
        let point = this.doc.createRange();
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
            point.selectNode(annotation);
        else
            point.selectNodeContents(annotation);
        point.collapse(position === 'before' || position === 'start');
        return point;
    },

    createWidgetXMLs: function WE_createWidgetXMLs(link) {
        default xml namespace = XHTML_NS;
        // Since Vimperator overrides XML settings, we override them again.
        let xmlSettings = XML.settings();
        XML.setSettings();
        const WE = WidgetEmbedder;
        let url = link.href;
        let entryURL = getEntryURL(url);
        let xmls = <>
            <a class="hBookmark-widget hBookmark-widget-counter"
               href={ entryURL }
               title={ WE.STRING_SHOW_ENTRY_TITLE }
               style="display: none;">
                <img src={ WE.IMAGE_API_PREFIX + url.replace(/#/g, "%23") }
                     alt={ WE.STRING_SHOW_ENTRY_TEXT }/>
            </a>
            <a class="hBookmark-widget hBookmark-widget-comments"
               href={ entryURL }
               title=""
               style="display: none;">[c]</a>
            <a class="hBookmark-widget hBookmark-widget-add-button"
               href={ addPageURL(url) }
               title={ WE.STRING_ADD_BOOKMARK_TITLE }>
                <img src={ WE.ADD_BUTTON_URL }
                     alt={ WE.STRING_ADD_BOOKMARK_TEXT }
                     width="16" height="12"/>
            </a>;
        </>;
        if (this._inNewTab)
            for each (let a in xmls)
                a.@target = '_blank';
        XML.setSettings(xmlSettings);
        return xmls;
    },

    handleEvent: function WE_handleEvent(event) {
        let doc = event.currentTarget;
        switch (event.type) {
        case "DOMNodeInserted":
            if (this._timerId) break;
            this._timerId = doc.defaultView.setTimeout(this.onTimer, WidgetEmbedder.MUTATION_DELAY, this);
            break;

        case "HB.PageInserted":
            doc.removeEventListener("DOMNodeInserted", this, false);
            /* FALL THROUGH */
        case "GM_AutoPagerizeNextPageLoaded":
            this.embed();
            break;

        case "GM_AutoPagerizeLoaded":
            doc.removeEventListener("GM_AutoPagerizeLoaded", this, false);
            doc.removeEventListener("DOMNodeInserted", this, false);
            doc.addEventListener("GM_AutoPagerizeNextPageLoaded", this, false, true);
            break;
        }
    },

    onTimer: function WE_onTimer(self) {
        self.embed();
        self._timerId = 0;
    },
});


function tryToEmbedWidgets(event) {
    let doc = event.target;
    if (Prefs.bookmark.get("embed.enabled") &&
        doc instanceof HTMLDocument &&
        HTTPCache.counter.isValid(doc.defaultView.location.href))
        new WidgetEmbedder(doc);
}

window.addEventListener("load", function WidgetEmbedder_BEGIN() {
    gBrowser.addEventListener("DOMContentLoaded", tryToEmbedWidgets, true);
}, false);


// "IconEmbedder" is deprecated.  Use "WidgetEmbedder".
var IconEmbedder = WidgetEmbedder;
