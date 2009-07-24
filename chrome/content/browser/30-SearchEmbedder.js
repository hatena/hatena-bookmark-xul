const EXPORT = ["SearchEmbedder"];

function SearchEmbedder(doc) {
    this.doc = doc;
    this.site = SiteInfoSet.Search.get(doc);
    this.state = SearchEmbedder.STATE_INITIALIZED;
    if (this.site)
        this.ready();
}

SearchEmbedder.STATE_INITIALIZED = 0x00;
SearchEmbedder.STATE_LOAD_DONE   = 0x01;
SearchEmbedder.STATE_SEARCH_DONE = 0x02;
SearchEmbedder.STATE_EMBED_READY = SearchEmbedder.STATE_LOAD_DONE |
                                   SearchEmbedder.STATE_SEARCH_DONE;

SearchEmbedder.STYLE = <![CDATA[
]]>.toString();

extend(SearchEmbedder.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/embed.properties"),

    get win SE_get_win() this.doc.defaultView,
    get url SE_get_url() this.win.location.href,

    ready: function SE_ready() {
        let url = this.url;
        let query = this.site.queryFirstString("query", url);
        if (!query) return;
        let encoding = this.site.queryFirstString("encoding", url) || "utf-8";
        let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                        createInstance(Ci.nsIScriptableUnicodeConverter);
        try {
            converter.charset = encoding;
            query = converter.ConvertToUnicode(unescape(query));
        } catch (ex) {}
        this.query = query;
        this.doc.addEventListener("DOMContentLoaded", this, false);
        SearchEmbedder.http.async_get(this.httpQuery, method(this, 'onSearch'));
    },

    get httpQuery SE_get_httpQuery() {
        // XXX ToDo: Move magic number "5" to prefs
        return '?q=' + encodeURIComponent(this.query) + '&limit=' + 5;
    },

    embed: function SE_embed() {
        if (this.state !== SearchEmbedder.STATE_EMBED_READY) return;
        let head = this.doc.getElementsByTagName("head")[0];
        let container = this.site.query("annotation", this.doc);
        if (!head || !container) return;

        let style = this.doc.createElement("style");
        style.textContent = SearchEmbedder.STYLE + (this.site.data.style || "");
        head.appendChild(style);

        let anchor = null;
        switch (this.site.data.annotationPosition || "last") {
        case "before":
            anchor = container;
            container = container.parentNode;
            break;
        case "after":
            anchor = container.nextSibing;
            container = container.parentNode;
            break;
        case "first":
            anchor = container.firstChild;
            break;
        case "last":
            break;
        }
        let search = this.createSearchResult(container);
        container.insertBefore(search, anchor);
    },

    createSearchResult: function SE_createSearchResult(container) {
        default xml namespace = XHTML_NS;
        // <></>.(See.mozilla.bug[330572].for.this.workaround);
        let data = this.data;
        let query = this.query;

        let result = <div id="hBookmark-search">
            <div class="hBookmark-search-heading">
                <a class="hBookmark-search-user"
                   href={ User.user.bookmarkHomepage }>
                    <img src={ User.user.getProfileIcon() }
                         alt="" width="16" height="16"/>
                    { User.user.name }
                </a>
                <span class="hBookmark-search-status"/>
            </div>
            <dl class="hBookmark-search-results"/>
        </div>;

        let heading = result.div[0];
        heading.insertChildAfter(heading.a[0], " ");
        let statusPattern = this.strings.get("search.statusPattern");
        this._appendFilledInContent(heading.span[0], statusPattern, {
            query:   <b class="hBookmark-search-query">{ query }</b>,
            count:   <b>{ data.bookmarks.length }</b>,
            total:   <b>{ data.meta.total }</b>,
            elapsed: <b>{ data.meta.elapsed.toFixed(2) }</b>,
        });

        let dl = result.dl[0];
        data.bookmarks.forEach(function (bookmark) {
            let entry = bookmark.entry;

            let title = <dt>
                <a href={ entry.url }>
                    <img src={ 'http://favicon.st-hatena.com/?url=' + encodeURIComponent(entry.url) }
                         alt="" width="16" height="16"/>
                </a>
            </dt>;
            this._appendEmphasizedContent(title.a[0], entry.title, query);

            let snippet = <></>
            if (entry.snippet) {
                snippet = <dd class="hBookmark-search-snippet"/>;
                this._appendEmphasizedContent(snippet, entry.snippet, query);
            }

            let info = <dd class="hBookmark-search-info">
                <span class="hBookmark-search-url"/>
                <span class="hBookmark-search-counter">{
                    UIUtils.getUsersText(entry.count)
                }</span>
            </dd>;
            this._appendEmphasizedContent(info.span[0], entry.url, query);
            info.insertChildAfter(info.span[0], " ");

            dl.appendChild(title + snippet + info);
        }, this);

        if (data.meta.total > data.bookmarks.length) {
            result.* += <div class="hBookmark-search-more">
                <a href={ B_HTTP + User.user.name + '/search?q=' + encodeURIComponent(query) }>{
                    this.strings.get("search.showAllLabel")
                }</a>
            </div>;
        }

        return xml2dom(result, { document: this.doc, context: container });
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
        text.split(keyword).forEach(function (fragment, i) {
            if (i) element.appendChild(<em>{ keyword }</em>);
            element.appendChild(fragment);
        });
        return element;
    },

    handleEvent: function SE_handleEvent(event) {
        switch (event.type) {
        case "DOMContentLoaded":
            this.state |= SearchEmbedder.STATE_LOAD_DONE;
            this.embed();
        }
    },

    onSearch: function SE_onSearch(data) {
        if (!data || !data.meta || data.meta.status !== 200 || !data.meta.total)
            return;
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
