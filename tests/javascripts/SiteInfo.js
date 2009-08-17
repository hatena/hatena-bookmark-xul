function setUp() {
    Components.utils.import("resource://hatenabookmark/modules/20-SiteInfo.jsm");
}

function testSiteInfo() {
    let set = new SiteInfoSet({
        matcher: SiteInfoSet.createURLMatcher('url'),
        sources: [
            { items: [
                {
                    url: "^http://www\\.google(?:\\.\\w+){1,2}/",
                    title: "Google",
                },
                {
                    url: /^http:\/\/www\.yahoo\.co\.jp\//,
                    title: "Yahoo",
                    dynamic: function (context, defaultValue) "dynamic result",
                },
            ] },
        ],
    });

    let info;

    info = set.get(createDocumentForURL("http://www.google.co.jp/"));
    assert.isTrue(info instanceof SiteInfo);
    assert.equals("Google", info.data.title);

    info = set.get(createDocumentForURL("http://www.yahoo.co.jp/path/to/something"));
    assert.isTrue(info instanceof SiteInfo);
    assert.equals("Yahoo", info.data.title);
    assert.equals("dynamic result", info.query("dynamic"));
}

function createDocumentForURL(url) {
    let doc = {
        defaultView: {
            location: {
                href: url,
            },
            GetWeakReference: function () ({
                QueryReferent: function () doc.defaultView,
            }),
            QueryInterface: function () this,
        }
    };
    return doc;
}
