const EXPORT = ['FullTextSearch'];

var FullTextSearch = {
    cache: new HTTPCache('searchCache', {
        expire: 60 * 60,
        baseURL: B_HTTP,
        seriarizer: 'uneval', // XXX The correct spell is "serializer"
        json: true,
    }),

    canSearch: function FTS_canSearch() !!User.user && User.user.plususer,

    search: function FTS_search(query, onResult, options) {
        if (!FullTextSearch.canSearch())
            setTimeout(onResult, 0, null);
        let path = FullTextSearch._getPath(query, options);
        FullTextSearch.cache.async_get(path, function FTS_search_callback(data) {
            if (!data)
                FullTextSearch.cache.clear(path);
            onResult(data);
        });
    },

    searchSync: function FTS_searchSync(query, options) {
        if (!FullTextSearch.canSearch()) return null;
        let path = FullTextSearch._getPath(query, options);
        return FullTextSearch.cache.get(path);
    },

    _getPath: function FTS__getPath(query, options) {
        options = options || {};
        let prefs = Prefs.bookmark;
        return User.user.name +
            '/search/json?q=' + encodeURIComponent(query) +
            '&limit=' + (options.limit || prefs.get('embed.searchCount')) +
            '&snip=' + (options.snippetLength || prefs.get('embed.searchSnippetLength')) +
            '&sort=' + (options.sortBy || prefs.get('embed.searchSortBy'));
    },
};
