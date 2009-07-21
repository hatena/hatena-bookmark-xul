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

extend(SearchEmbedder.prototype, {
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
        SearchEmbedder.http.async_get(query, method(this, 'onSearch'));
    },

    embed: function SE_embed() {
        if (this.state !== SearchEmbedder.STATE_EMBED_READY) return;
        let container = this.site.query("annotation", this.doc);
        if (!container) return;
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

    // XXX WIP! WIP! WIP!
    createSearchResult: function SE_createSearchResult(container) {
        default xml namespace = XHTML_NS;
        <></>.(see.mozilla.bug[330572].for.this.expression);

        let result = <div id="hBookmark-search">
            <div id="hBookmark-search-heading">
                <span id="hBookmark-search-user">
                    <img src={ User.user.getProfileIcon() }
                         alt="" width="16" height="16"/>
                    { User.user.name }
                </span>
                <span id="hBookmark-search-status"/>
            </div>
            <dl id="hBookmark-search-results"/>
        </div>;
        let headingParts = {
            query: <span id="hBookmark-search-query">{ this.query }</span>,
            count: <span id="hBookmark-search-count">{ this.data.bookmarks.length }</span>,
            total: <span id="hBookmark-search-total">{ this.data.meta.total }</span>,
            elapsed: <span id="hBookmark-search-elapsed">{ this.data.meta.elapsed.toFixed(2) }</span>,
        };
        let headingContent = '{count} of {total} for {query} ({elapsed} sec)';
        headingContent.split(/\{(.*?)\}/).map(function (c, i) {
            return ((i & 1) && c in headingParts) ? headingParts[c] : c;
        }).reduce(function (p, c) p.appendChild(c), result.div[0].span[1]);

        this.data.bookmarks.reduce(function (dl, bookmark) {
            return dl.appendChild(<>
                <dt>
                    <a href={ bookmark.entry.url }>
                    <img src={ 'http://favicon.st-hatena.com/?url=' + encodeURIComponent(bookmark.entry.url) }
                         alt="" width="16" height="16"/>
                        { bookmark.entry.title }
                    </a>
                </dt>
                <dd>{ bookmark.entry.snippet || "" }</dd>
            </>);
        }, result.dl[0]);

        return xml2dom(result, { document: this.doc, context: container });
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
                return B_HTTP + User.user.name + '/search/json?limit=' +
                       5 + '&q=';
            },
        },
        seriarizer: 'uneval', // XXX The correct spell is "serializer"
        json: true,
        encoder: encodeURIComponent,
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
