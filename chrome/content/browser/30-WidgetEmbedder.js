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

    IMAGE_API_PREFIX:   B_STATIC_HTTP + 'entry/image/',
    COMMENTS_IMAGE_URL: "data:image/png,%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%0E%00%00%00%0D%08%06%00%00%00%99%DC_%7F%00%00%00%01sRGB%00%AE%CE%1C%E9%00%00%00%06bKGD%00%FF%00%FF%00%FF%A0%BD%A7%93%00%00%01%B9IDAT(%CF%8D%D0%B1n%13A%14%05%D0%F7f%DE%8C%1D3%0EA%C8%A0%15q%1C%2C%84%84%A0%A0p%89%F0%1F%20Y4%E1%23%A0%A1%A4I%C3%17%F8%07(%91%1B%0A%D7%14%08%C4'%A4%81%02%D92V%D6%12%B1%9DY%EF%EE%CC%DB%19%9A8e%E4%5B%DF%23%5D%5D%1C%8F%C7%0DcL%03%00%8C%D6%FA%20%C6h%10%B1%81%88%1A%00%20%C6%E8b%8C%1BD%B4%CE%B9%25%00Xk%ED%86%8C1%8D%18%E3%5D%A5T%22%A5lk%AD%EF%11%D1m!%C4-%00%80%10B%C6%CC%2B%E7%5CJDS%EF%FD%DC%18%03%04%00F)%95%7C%FE%9D%9C%CE.U%1Fn%C8%83%A6%FFv%F2h~%CA%CC%25i%AD%0F%A4%94%ED%D9%A5%EA%7Fy%7Bt%93%83%C1p%D2WJ%B5%85%10K%01%00%7BDt%07v%CCUwO%C4%18%A5%10B%ED%0A%85%10*%C6(%05%22V!%04%BF%2B%0C!xD%AC%04%00%E4%CC%7C%B1%2B%BC%EA%E6%E4%9C%5B%12%D1%B4%BD%CF%3F%06%C3%C9%8Bma%7B%D4%608%B9F%87M%FF%DD%7B%3Fe%E6%25%01%80%F5%DE%CF%DF%3C%3E%FFX%AB%D5%9E%D4%EB%F5%E3%0F_%CD%BB-zv%3F%FC%3Ay%9A%8D%8B%A2%F8%E3%9C%3B%2B%0A%3FGDK%D6%DA%8D1%06%CA%B2%C4%10BYU%D5%EC%B0Y%7B%3E%18N%5E%1E%ED%FB%9F%AF%1E%FE%FB%B4Z%F9%0BfNC%08%7F%11qi%AD%DDP%9E%E7e%B7%DB%E54M%B9%AA%AAl%BD%5E%9F%BF%3E%CE%DE%2B%A5%EA%88Xy%0F93gR%CA%2C%CB2%DB%E9t%8A%C5bQ%E1v%FFh4%92%ADVK%01%00%01%00%E5y%AE%B4%D6!%C6%C8EQ%F8%24I%7C%AF%D7%BB~%FF%3F%87%DA%E3%E2KUj6%00%00%00%00IEND%AEB%60%82",
    ADD_BUTTON_URL:     B_STATIC_HTTP + 'images/append.gif',

    STRING_SHOW_ENTRY_TITLE:   embedStrings.get('showEntryTitle'),
    STRING_SHOW_ENTRY_TEXT:    embedStrings.get('showEntryText'),
    STRING_SHOW_COMMENT_TITLE: embedStrings.get('showCommentTitle'),
    STRING_SHOW_COMMENT_TEXT:  embedStrings.get('showCommentText'),
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
               style="display: none !important;">
                <img src={ WE.IMAGE_API_PREFIX + url.replace(/#/g, "%23") }
                     alt={ WE.STRING_SHOW_ENTRY_TEXT }/>
            </a>
            <a class="hBookmark-widget hBookmark-widget-comments"
               href={ entryURL }
               title={ WE.STRING_SHOW_COMMENT_TITLE }
               style="display: none !important;">
                <img src={ WE.COMMENTS_IMAGE_URL }
                     alt={ WE.STRING_SHOW_COMMENT_TEXT }
                     width="16" height="13"/>
            </a>
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
