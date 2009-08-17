Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules();

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
            let table = doc.getElementById("mbEnd");
            if (table) {
                let tr = doc.createElement("tr");
                let td = doc.createElement("td");
                tr.appendChild(td);
                table.tBodies[0].appendChild(tr);
                return td;
            }
            return doc.getElementById("res");
        },
        annotationPosition: 'first',
        style: <![CDATA[
            td > #hBookmark-search {
                margin: 1em 0 0 0;
                width: auto;
                float: none;
                white-space: normal;
            }
            div > #hBookmark-search {
                font-size: 0.8em;
            }
        ]]>.toString(),
    },
    { // Yahoo Web Search
        url:        /^http:\/\/search\.yahoo(?:\.\w+){1,2}\/search\?/,
        baseDomain: /^yahoo\./,
        query:      /[?&;]p=([^?&;#]+)/,
        encoding:   /[?&;]ei=([\w-]+)/,
        annotation: 'id("yschres")',
        style: <![CDATA[
            #hBookmark-search {
                margin-right: 1em;
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
