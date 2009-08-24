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
            url = URLNormalizer.rules[url.asciiHost](url);
        return url;
    },
};

URLNormalizer.rules = {
    'www.amazon.co.jp': function normalize_amazon(url) {
        let match = url.path.match(/(?:\/(?:ASIN|dp|product)\/|[?&;]asins=)(\w{10})\b/);
        if (!match) return url;
        url.host = 'www.amazon.co.jp';
        url.filePath = '/gp/product/' + match[1];
        url.query = '';
        return url;
    },
};

URLNormalizer.rules['amazon.co.jp'] = URLNormalizer.rules['www.amazon.co.jp'];
