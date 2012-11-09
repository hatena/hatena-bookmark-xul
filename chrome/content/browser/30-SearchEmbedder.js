const EXPORT = ["SearchEmbedder"];

function SearchEmbedder(doc) {
    this.site = SiteInfoSet.Search.get(doc);
    this.state = SearchEmbedder.STATE_INITIALIZED;
    if (this.site && !this.site.data.disable &&
        this.isValidDomain() && !this.searchElement)
        this.ready();
}

(function () {

var modules = {};
Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm", modules);

SearchEmbedder.STATE_INITIALIZED = 0x00;
SearchEmbedder.STATE_LOAD_DONE   = 0x01;
SearchEmbedder.STATE_SEARCH_DONE = 0x02;
SearchEmbedder.STATE_EMBED_READY = SearchEmbedder.STATE_LOAD_DONE |
                                   SearchEmbedder.STATE_SEARCH_DONE;
SearchEmbedder.STATE_COMPLETE    = -1;

extend(SearchEmbedder.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/embed.properties"),

    get doc() this.site.doc,
    get win() this.site.win,
    get url() this.site.url,

    isValidDomain: function SE_isValidDomain() {
        const TLDService = getService("@mozilla.org/network/effective-tld-service;1", Ci.nsIEffectiveTLDService);
        let domainPattern = this.site.data.baseDomain;
        if (!domainPattern) return false;
        if (typeof domainPattern === "string")
            domainPattern = new RegExp(domainPattern);
        let domain = TLDService.getBaseDomainFromHost(this.win.location.hostname);
        return domainPattern.test(domain);
    },

    ready: function SE_ready() {
        let url = this.url;
        let query = this.site.queryFirstString("query", url);
        if (!query) return;
        let encoding = this.site.queryFirstString("encoding", url) || "utf-8";
        let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                        createInstance(Ci.nsIScriptableUnicodeConverter);
        query = unescape(query.replace(/\+/g, " "));
        try {
            converter.charset = encoding;
            query = converter.ConvertToUnicode(query);
        } catch (ex) {}
        this.query = query;
        this.doc.addEventListener("DOMContentLoaded", this, false);
        //this.win.addEventListener("pageshow", this, false);
        //this.win.addEventListener("load", this, false);
        FullTextSearch.search(query, method(this, 'onSearch'));
        // XXX Since net.get() can't handle timeout,
        // manually force an error display.
        this.win.setTimeout(function (self) {
            if (self.state === SearchEmbedder.STATE_COMPLETE) return;
            p('SearchEmbedder: maybe timeout');
            self.embedFailure();
            //self.state = SearchEmbedder.STATE_COMPLETE;
        }, 15000, this);
    },

    embed: function SE_embed() {
        if (this.state === SearchEmbedder.STATE_COMPLETE) return;
        if (this.state !== SearchEmbedder.STATE_EMBED_READY) {
            this.embedStandby();
            return;
        }
        let data = this.data;
        if (data && data.meta && data.meta.status === 200 && data.meta.total) {
            this.embedContent(this.createSearchResult());
        } else {
            this.embedFailure();
        }
        this.state = SearchEmbedder.STATE_COMPLETE;
    },

    embedStandby: function SE_embedStandby() {
        if (!Prefs.bookmark.get("embed.showSearchStandby")) return;
        this.embedContent(<div class="hBookmark-search-standby">{
            this.strings.get("search.standbyLabel")
        }</div>);
    },

    embedFailure: function SE_embedFailure() {
        if (!Prefs.bookmark.get("embed.showSearchStandby")) return;
        this.embedContent(<div class="hBookmark-search-failure">{
            (this.data && this.data.meta && !this.data.meta.total)
                ? this.strings.get("search.noMatchError")
                : this.strings.get("search.unexpectedError")
        }</div>);
    },

    embedContent: function SE_embedContent(content) {
        let search = this.searchElement;
        if (!search) {
            let point = this.insertionPoint;
            if (!point) return;
            this.embedStyle();
            search = xml2dom(this.createSearchContainer(), point);
            point.insertNode(search);
        }
        let container = search.getElementsByClassName("hBookmark-search-container")[0];
        if (!container) return;
        content =
            (typeof content === "xml")    ? xml2dom(content, container)      :
            (typeof content === "string") ? this.doc.createTextNode(content) :
                                            content;
        UIUtils.deleteContents(container);
        container.appendChild(content);
    },

    embedStyle: function SE_embedStyle() {
        let head = this.doc.getElementsByTagName("head")[0];
        if (!head) return;
        let style = this.doc.createElement("style");
        style.textContent = SearchEmbedder.STYLE + (this.site.data.style || "");
        head.appendChild(style);
    },

    get insertionPoint() {
        if (this._insertionPoint) return this._insertionPoint.cloneRange();
        let annotation = this.site.query("annotation", this.doc);
        if (!annotation) return null;
        let range = this.doc.createRange();
        switch (this.site.data.annotationPosition || "last") {
        case "before":
            range.selectNode(annotation);
            range.collapse(true);
            break;
        case "after":
            range.selectNode(annotation);
            range.collapse(false);
            break;
        case "first":
            range.selectNodeContents(annotation);
            range.collapse(true);
            break;
        case "last":
        default:
            range.selectNodeContents(annotation);
            range.collapse(false);
            break;
        }
        this._insertionPoint = range;
        return range.cloneRange();
    },

    get searchElement() {
        return this.doc.getElementById("hBookmark-search");
    },

    createSearchContainer: function SE_createSearchContainer() {
        default xml namespace = XHTML_NS;
        return <div id="hBookmark-search">
            <div class="hBookmark-search-heading">
                <span class="hBookmark-search-title">{
                    this.strings.get("search.title")
                }</span>
            </div>
            <div class="hBookmark-search-container"/>
        </div>;
    },

    createSearchResult: function SE_createSearchResult() {
        default xml namespace = XHTML_NS;
        <></>.(This.is.a.workaround.for.mozilla.bug[330572]);
        // Since Vimperator overrides XML settings, we override them again.
        let xmlSettings = XML.settings();
        XML.setSettings({ ignoreWhitespace: true });
        let data = this.data;
        let query = this.query;

        let result = <>
            <div class="hBookmark-search-info">
                <a class="hBookmark-search-user"
                   href={ User.user.bookmarkHomepage }>
                    <img src={ User.user.getProfileIcon() }
                         alt="" width="16" height="16"/>
                    { User.user.name }
                </a>
                <span class="hBookmark-search-status"/>
            </div>
            <dl class="hBookmark-search-results"/>
        </>;

        let status = result[0].span[0];
        status.parent().insertChildBefore(status, " ");
        let statusPattern = this.strings.get("search.statusPattern");
        this._appendFilledInContent(status, statusPattern, {
            query:   <b class="hBookmark-search-query">{ query }</b>,
            count:   <b>{ data.bookmarks.length }</b>,
            total:   <b>{ data.meta.total }</b>,
            elapsed: <b>{ data.meta.elapsed.toFixed(2) }</b>,
        });

        let queryRE = this._createKeywordPattern(data.meta.query.queries);
        let dl = result[1];
        data.bookmarks.forEach(function (bookmark) {
            let entry = bookmark.entry;

            let title = <dt>
                <a href={ entry.url }>
                    <img src={ 'http://cdn-ak.favicon.st-hatena.com/?url=' + encodeURIComponent(entry.url) }
                         alt="" width="16" height="16"/>
                </a>
            </dt>;
            this._appendEmphasizedContent(title.a[0], entry.title, queryRE);

            let snippet = <></>;
            if (entry.snippet) {
                snippet = <dd class="hBookmark-search-snippet"/>;
                this._appendEmphasizedContent(snippet, entry.snippet, queryRE);
            }

            let comment = <></>;
            if (bookmark.comment) {
                comment = <dd class="hBookmark-search-comment"/>;
                this._appendCommentContents(comment, bookmark.comment, queryRE);
            }

            let info = <dd class="hBookmark-search-info">
                <span class="hBookmark-search-url"/>
                <a class="hBookmark-search-counter"
                   href={ entryURL(entry.url) }>{
                    UIUtils.getUsersText(entry.count)
                }</a>
            </dd>;
            let displayURL = UIUtils.cropURL(entry.url);
            this._appendEmphasizedContent(info.span[0], displayURL, queryRE);
            if (entry.count >= 3) {
                info.a[0].@class += (entry.count >= 10)
                    ? " hBookmark-search-too-many" : " hBookmark-search-many";
            }
            info.insertChildAfter(info.span[0], " ");

            dl.appendChild(title + snippet + comment + info);
        }, this);

        if (data.meta.total > data.bookmarks.length) {
            result += <div class="hBookmark-search-more">
                <a href={ B_HTTP + FullTextSearch.getPath(query) }>{
                    this.strings.get("search.showAllLabel")
                }</a>
            </div>;
        }

        if (Prefs.bookmark.get("link.openInNewTab")) {
            for each (let a in result..a)
                a.@target = "_blank";
        }
        XML.setSettings(xmlSettings);
        return result;
    },

    _appendFilledInContent: function SE__appendFilledInContent(element,
                                                               pattern,
                                                               map) {
        pattern.split(/\{(.*?)\}/).forEach(function (key, i) {
            element.appendChild((i & 1) ? map[key] : key);
        });
        return element;
    },

    _appendEmphasizedContent: function SE__appendEmphasizedContent(element,
                                                                   text,
                                                                   keyword) {
        default xml namespace = XHTML_NS;
        if (keyword.constructor.name !== "RegExp")
            keyword = this._createKeywordPattern(keyword);
        text.split(keyword).forEach(function (fragment, i) {
            element.appendChild((i & 1) ? <em>{ fragment }</em> : fragment);
        });
        return element;
    },

    _createKeywordPattern: function SE__createKeywordPattern(keywords) {
        return new RegExp("(" + [].concat(keywords).map(function (k) {
            return k.replace(/\W/g, "\\$&");
        }).join("|") + ")", "i");
    },

    _appendCommentContents: function SE__appendCommentContents(element,
                                                               comment,
                                                               keyword) {
        default xml namespace = XHTML_NS;
        let tags = comment.match(/\[[^\[\]]+\]/gy);
        if (tags) {
            let n = 0;
            tags.forEach(function (tag, i, tags) {
                n += tag.length;
                let tagElement = <span class="hBookmark-search-tag"/>;
                this._appendEmphasizedContent(tagElement, tag.slice(1, -1), keyword);
                element.appendChild(tagElement);
                element.appendChild((i === tags.length - 1) ? " " : ", ");
            }, this);
            comment = comment.substring(n);
        }
        this._appendEmphasizedContent(element, comment, keyword);
        return element;
    },

    handleEvent: function SE_handleEvent(event) {
        switch (event.type) {
        case "DOMContentLoaded":
            this.state |= SearchEmbedder.STATE_LOAD_DONE;
            this.embed();
            break;

        case "pageshow":
        case "load":
            p(event.type + " " + this.state);
            break;
        }
    },

    onSearch: function SE_onSearch(data) {
        this.data = data;
        this.state |= SearchEmbedder.STATE_SEARCH_DONE;
        this.embed();
    },
});

// CSS を読み込み
var xhr = new modules.XMLHttpRequest();
xhr.open("GET", "resource://hatenabookmark/css/search-embedder.css", false);
xhr.overrideMimeType("text/css");
xhr.send();
SearchEmbedder.STYLE = xhr.responseText;

}).call(this);

(function () {
    var progressListener = Object.create(WebProgressListenerPrototype);
    progressListener.onLocationChange = function SEPL_onLocationChange(
                                            progress, request, location) {
        var isEmbedSearchDisabled = (
                !User.user || !User.user.canUseFullTextSearch ||
                !Prefs.bookmark.get("embed.search"));
        if (isEmbedSearchDisabled) return;
        new SearchEmbedder(progress.DOMWindow.document);
    };

    window.addEventListener("load", function SetupSearchEmbedder() {
        gBrowser.addProgressListener(progressListener);
    }, false);

    window.addEventListener("unload", function ShutdownSearchEmbedder() {
        gBrowser.removeProgressListener(progressListener);
    }, false);
}).call(this);
