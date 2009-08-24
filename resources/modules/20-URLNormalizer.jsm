Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");

const EXPORTED_SYMBOLS = ['URLNormalizer'];


var URLNormalizer = {
    normalize: function normalize(url) {
        if (!(url instanceof Ci.nsIURL)) return null;
        url = url.clone().QueryInterface(Ci.nsIURL);

        url.filePath = url.filePath.replace(/%7E/g, '~');
        url.query    = url.query.replace(/(?:^|&)ref=rss(?=&|$)/, '');
        url.ref      = url.ref.replace(/^(?:see)?more$/, '');

        if (url.asciiHost in URLNormalizer.rules)
            url = URLNormalizer.rules[url.asciiHost](url) || url;
        return url;
    },
};

URLNormalizer.rules = {
    'www.amazon.co.jp': function normalize_Amazon(url) {
        let match = url.path.match(/(?:\/(?:ASIN|dp|product)\/|[?&;]asins=)(\w{10})\b/);
        if (!match) return url;
        url.host = 'www.amazon.co.jp';
        url.filePath = '/gp/product/' + match[1];
        url.query = '';
        return url;
    },

    'd.hatena.ne.jp': function normalize_HatenaDiary(url) {
        let match = url.path.match(/^\/asin\/(\w{10})(?:[\/?#]|$)/);
        if (!match) return url;
        url.filePath = '/asin/' + match[1];
        url.query = '';
        return url;
    },

    'www.youtube.com': function normalize_YouTube_www(url) {
        let match = url.query.match(/(?:^|&)(v=[^&]+)/);
        if (!match) return url;
        url.query = match[1];
        return url;
    },

    'youtube.com': function normalize_YouTube_noprefix(url) {
        url = this['www.youtube.com'](url);
        url.host = 'www.youtube.com';
        return url;
    },
};

URLNormalizer.rules['amazon.co.jp'] = URLNormalizer.rules['www.amazon.co.jp'];
URLNormalizer.rules['jp.youtube.com'] = URLNormalizer.rules['www.youtube.com'];
