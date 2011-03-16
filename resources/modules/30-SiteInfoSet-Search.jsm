Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = [];

let builtInSearchSiteInfo = [
    /*
    {
        url:
        baseDomain:
        query:
        encoding:
        annotation:
        annotationPosition:
        style:
        disable:
    },
    */
    { // Google Web Search
        url:        /^http:\/\/www\.google(?:\.\w+){1,2}\/search\?/,
        baseDomain: /^google\./,
        query:      /[?&;]q=([^?&;#]+)/,
        encoding:   /[?&;]ie=([\w-]+)/,
        //annotation: 'id("res")',
        annotation: function (doc) {
            let rhs = doc.getElementById("rhs");
            if (rhs) {
                let div = doc.createElement('div');
                rhs.appendChild(div);
                return div;
            }
            return doc.getElementById("res");
        },
        annotationPosition: 'first',
        style: <![CDATA[
            #rhs #hBookmark-search {
                margin: 1.2em 1.5em 0 0.7em;
                width: auto;
                float: none;
            }
            #res #hBookmark-search {
                font-size: 0.8em;
                margin-right: -32%;
            }
        ]]>.toString(),
    },
    { // Yahoo Web Search
        url:        /^http:\/\/search\.yahoo(?:\.\w+){1,2}\/search\?/,
        baseDomain: /^yahoo\./,
        query:      /[?&;]p=([^?&;#]+)/,
        encoding:   /[?&;]ei=([\w-]+)/,
        annotation: 'id("sIn")',
        style: <![CDATA[
            #hBookmark-search {
                width: auto;
            }
        ]]>.toString(),
    },
];

let Search = new SiteInfoSet({
    matcher: SiteInfoSet.createURLMatcher('url'),
    sources: [
        { file: 'Search.user.siteinfo.js' },
        { items: builtInSearchSiteInfo },
    ],
});

SiteInfoSet.Search = Search;
