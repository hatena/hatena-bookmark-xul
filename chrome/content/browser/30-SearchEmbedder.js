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

    createSearchResult: function SE_createSearchResult(container) {
        var result = <p>
            {this.data.meta.total} results
        </p>;
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
            let site = null;
            if (!User.user || !User.user.plususer
                // || !Prefs.bookmark.get("embed.search")
               )
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
