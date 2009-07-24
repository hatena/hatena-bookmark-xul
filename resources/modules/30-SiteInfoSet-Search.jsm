Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules();

const EXPORTED_SYMBOLS = [];

// XXX ToDo: SITEINFOの外部ファイル化及びその外部ファイルの自動更新

let search = new SiteInfoSet("url");

search.addData([
    /*
    {
        url:
        query:
        encoding:
        annotation:
        annotationPosition:
        style:
    },
    */
    { // Google Web Search
        url:        /^http:\/\/www\.google(?:\.\w+){1,2}\/search\?/,
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
                font-size: 1em;
                margin: 1em 0 0 0;
                width: auto;
                float: none;
                white-space: normal;
            }
        ]]>.toString(),
    },
    { // Yahoo Web Search
        url:        /^http:\/\/search\.yahoo(?:\.\w+){1,2}\/search\?/,
        query:      /[?&;]p=([^?&;#]+)/,
        encoding:   /[?&;]ei=([\w-]+)/,
        annotation: 'id("yschres")',
    },
]);

SiteInfoSet.Search = search;
