const EXPORT = ["SearchEmbedder"];

function SearchEmbedder(doc) {
    this.site = SiteInfoSet.Search.get(doc);
    this.state = SearchEmbedder.STATE_INITIALIZED;
    if (this.site && !this.site.data.disable &&
        this.isValidDomain() && !this.searchElement)
        this.ready();
}

SearchEmbedder.STATE_INITIALIZED = 0x00;
SearchEmbedder.STATE_LOAD_DONE   = 0x01;
SearchEmbedder.STATE_SEARCH_DONE = 0x02;
SearchEmbedder.STATE_EMBED_READY = SearchEmbedder.STATE_LOAD_DONE |
                                   SearchEmbedder.STATE_SEARCH_DONE;
SearchEmbedder.STATE_COMPLETE    = -1;

extend(SearchEmbedder.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/embed.properties"),

    get doc SE_get_doc() this.site.doc,
    get win SE_get_win() this.site.win,
    get url SE_get_url() this.site.url,

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
        SearchEmbedder.http.async_get(this.httpQuery, method(this, 'onSearch'));
        // XXX Since net.get() can't handle timeout,
        // manually force an error display.
        this.win.setTimeout(function (self) {
            if (self.state === SearchEmbedder.STATE_COMPLETE) return;
            p('SearchEmbedder: maybe timeout');
            self.embedFailure();
            //self.state = SearchEmbedder.STATE_COMPLETE;
        }, 15000, this);
    },

    get httpQuery SE_get_httpQuery() {
        return '?q=' + encodeURIComponent(this.query) +
               '&limit=' + Prefs.bookmark.get("embed.searchCount") +
               '&snip=' + Prefs.bookmark.get("embed.searchSnippetLength");
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

    get insertionPoint SE_get_insertionPoint() {
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

    get searchElement SE_get_searchElement() {
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
                    <img src={ 'http://favicon.st-hatena.com/?url=' + encodeURIComponent(entry.url) }
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
                <a href={ B_HTTP + User.user.name + '/search?q=' + encodeURIComponent(query) }>{
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
        if (!data)
            SearchEmbedder.http.clear(this.httpQuery);
        this.data = data;
        this.state |= SearchEmbedder.STATE_SEARCH_DONE;
        this.embed();
    },
});

extend(SearchEmbedder, {
    progressListener: {
        __proto__: WebProgressListenerPrototype,

        onLocationChange: function SEPL_onLocationChange(progress, request,
                                                         location) {
            if (!User.user || !User.user.plususer ||
                !Prefs.bookmark.get("embed.search"))
                return;
            new SearchEmbedder(progress.DOMWindow.document);
        },
    },

    http: new HTTPCache('searchCache', {
        expire: 60 * 60,
        baseURL: {
            toString: function SE_s_cache_baseURL_toString() {
                return B_HTTP + User.user.name + '/search/json';
            },
        },
        seriarizer: 'uneval', // XXX The correct spell is "serializer"
        json: true,
    }),
});


SearchEmbedder.STYLE = <![CDATA[
    #hBookmark-search {
        font-size: 1em;
        line-height: 1.4;
        color: #000;
        margin: 0;
        padding: 0;
        width: 30%;
        max-width: 25em;
        float: right;
    }
    #hBookmark-search span,
    #hBookmark-search a,
    #hBookmark-search b,
    #hBookmark-search em,
    #hBookmark-search img,
    #hBookmark-search div,
    #hBookmark-search dl,
    #hBookmark-search dt,
    #hBookmark-search dd {
        font: inherit;
        background: none;
        color: inherit;
        margin: 0;
        padding: 0;
        border: none;
    }
    #hBookmark-search :link {
        text-decoration: underline;
        color: #2200cc;
    }
    #hBookmark-search :visited {
        text-decoration: underline;
        color: #551a8b;
    }
    #hBookmark-search .hBookmark-search-heading {
        margin-bottom: 0.3em;
        padding-bottom: 0.2em;
        border-bottom: 1px solid #c9d7f1;
        overflow: hidden;
        position: relative;
    }
    #hBookmark-search .hBookmark-search-title {
        background: url("http://b.st-hatena.com/images/favicon.gif") left center no-repeat;
        padding-left: 18px;
        font-weight:bold;
    }
    #hBookmark-search .hBookmark-search-user {
        color: inherit;
        text-decoration: none;
        font-size: 12px;
        display: inline-block;
        text-align: right;
        float: right;
        margin-bottom: 1em;
        white-space: nowrap;
    }
    #hBookmark-search a > img {
        margin: 0 3px -5px 0;
    }
    #hBookmark-search .hBookmark-search-status {
        font-size: 12px;
    }
    #hBookmark-search div.hBookmark-search-container {
    }
    #hBookmark-search dl {
        clear: both;
        margin: 0;
        padding: 0 0 10px 20px;
    }
    #hBookmark-search dt {
        margin-top: 1em;
    }
    #hBookmark-search dd {
        font-size: 90%;
        margin: 0.2em 0;
    }
    #hBookmark-search .hBookmark-search-comment {
        color: #777777;
    }
    #hBookmark-search .hBookmark-search-tag {
        color: #6666cc;
    }
    #hBookmark-search dd.hBookmark-search-info {
    }
    #hBookmark-search .hBookmark-search-url {
        color: green;
        margin-right: 3px;
    }
    #hBookmark-search a.hBookmark-search-counter {
        display: inline-block;
    }

    #hBookmark-search dt > a > img {
        position: relative;
        margin-left: -20px;
    }
    #hBookmark-search .hBookmark-search-many {
        background-color: #fff0f0;
        color: #ff6666;
        font-weight: bold;
    }
    #hBookmark-search .hBookmark-search-too-many {
        background-color: #ffcccc;
        color: #ff0000;
        font-weight: bold;
    }
    #hBookmark-search .hBookmark-search-more {
        text-align: right;
        margin: 0.5em 0 0 0;
    }
    #hBookmark-search .hBookmark-search-more > a {
        background: url("http://b.st-hatena.com/images/favicon.gif") left center no-repeat;
        padding-left: 18px;
        color: #7777cc;
    }
    #hBookmark-search .hBookmark-search-query,
    #hBookmark-search em {
        font-weight: bold;
    }
]]>.toString();


window.addEventListener("load", function SetupSearchEmbedder() {
    gBrowser.addProgressListener(SearchEmbedder.progressListener,
                                 Ci.nsIWebProgress.NOTIFY_LOCATION);
}, false);

window.addEventListener("unload", function ShutdownSearchEmbedder() {
    gBrowser.removeProgressListener(SearchEmbedder.progressListener);
}, false);

EventService.createListener("UserChange", function () {
    SearchEmbedder.http.cache.clearAll();
});
