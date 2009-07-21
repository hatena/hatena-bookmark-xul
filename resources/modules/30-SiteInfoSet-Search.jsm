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
        annotation: 'id("res")',
    },
    { // Yahoo Web Search
        url:        /^http:\/\/search\.yahoo(?:\.\w+){1,2}\/search\?/,
        query:      /[?&;]p=([^?&;#]+)/,
        encoding:   /[?&;]ei=([\w-]+)/,
        annotation: 'id("yschres")',
    },
]);

SiteInfoSet.Search = search;
