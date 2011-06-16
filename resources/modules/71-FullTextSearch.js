Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ['FullTextSearch'];

var FullTextSearch = {
    cache: new HTTPCache('searchCache', {
        expire: 60 * 60,
        baseURL: B_HTTP,
        seriarizer: 'uneval', // XXX The correct spell is "serializer"
        json: true,
    }),

    canSearch: function FTS_canSearch() !!User.user && User.user.plususer,

    search: function FTS_search(query, onResult, options) {
        if (!FullTextSearch.canSearch()) {
            new BuiltInTimer({
                observe: function () onResult(null),
            }, 10, Ci.nsITimer.TYPE_ONE_SHOT);
            return;
        }
        let path = FullTextSearch.getJsonPath(query, options);
        p(path);
        FullTextSearch.cache.async_get(path, function FTS_search_callback(data) {
            if (!data)
                FullTextSearch.cache.clear(path);
            onResult(data);
        });
    },

    searchSync: function FTS_searchSync(query, options) {
        if (!FullTextSearch.canSearch()) return null;
        let path = FullTextSearch.getJsonPath(query, options);
        return FullTextSearch.cache.get(path);
    },

    getJsonPath: function FTS_getJsonPath(query, options) {
        options = options || {};
        options.json = true;
        return FullTextSearch.getPath(query, options);
    },

    getPath: function FTS_getPath(query, options) {
        options = options || {};
        let prefs = Prefs.bookmark;
        return User.user.name +
            '/search' + (options.json ? '/json' : '') + '?q=' + encodeURIComponent(query) +
            '&limit=' + (options.limit || prefs.get('embed.searchCount')) +
            '&snip=' + (options.snippetLength || prefs.get('embed.searchSnippetLength')) +
            '&sort=' + (options.sortBy || prefs.get('embed.searchSortBy'));
    },
};
