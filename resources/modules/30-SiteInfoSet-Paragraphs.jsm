Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules();

const EXPORTED_SYMBOLS = [];

// XXX ToDo: SITEINFOの外部ファイル化及びその外部ファイルの自動更新

let paragraphs = new SiteInfoSet("domain");

paragraphs.addData([
    /*
    {
        domain:
                A regular expression that matches the URL of the target page
                or a string that express a regular expression pattern.
        paragraph:
                An XPath expression that mathes article parts of the page
                or a function that returns an array of elements.
        link:
                An XPath expression that matches a link that the article
                refers to or a function that returns a element.  This parameter
                is optional.  If you omit this, the article specified in
                paragraph is used.
        annotation:
                An XPath expression that matches an element where Hatena
                Bookmark widgets are inserted or a function that returns an
                element.  This parameter is optional.  If you omit this, the
                link is used.
        annotationPosition:
                One of the strings: "before", "after", "first", "last".  This
                indicates the position where widgets are inserted, relative to
                the annotation element.  This parameter is optinal and the
                default value is "after".
        isPage:
                An XPath expression that evaluates to a boolean value that
                indicates whether the inserted element is inserted by
                AutoPagerize or such scripts, or a function that returns a
                boolean value.  This parameter is optional.  This is used for
                efficiency.
    },
    */
    { // Google Web Search
        domain:     /^http:\/\/www\.google(?:\.\w+){1,2}\/search\?/,
        paragraph:  'id("res")/div/ol/li[contains(concat(" ", @class, " "), " g ")]',
        link:       'descendant::a[contains(concat(" ", @class, " "), "l")]',
        //annotation: 'descendant::cite',
        annotation: 'descendant::span[@class = "gl"]',
        isPage:     'self::div[ol and parent::div[@id = "res"]]',
    },
    { // Google News
        domain:     /^http:\/\/news\.google(?:\.\w+){1,2}\//,
        paragraph:  'descendant::div[contains(concat(" ", @class, " "), " story ")]',
        link:       'descendant::a[starts-with(concat(" ", @class), " usg-")]',
        annotation: 'descendant::div[contains(concat(" ", @class, " "), " sources ")]/*[contains(concat(" ", @class, " "), " moreLinks ") or not(following-sibling::*)]',
        isPage:     'self::*[@id = "search-stories"]',
    },
    { // Yahoo Web Search
        domain:     /^http:\/\/search\.yahoo(?:\.\w+){1,2}\/search\?/,
        paragraph:  'id("yschcont")/descendant::div[@class = "web"]',
        link: function (context) {
            let link = context.getElementsByClassName("yschttl")[0];
            if (!link || !link.href) return null;
            link = link.cloneNode(true);
            let match = link.href.match(/\/\*-(.+)/);
            try {
                link.href = decodeURIComponent(match[1]);
            } catch (ex) {
                return null;
            }
            return link;
        },
        annotation: 'descendant::div[@class = "sinf"]',
        annotationPosition: 'last',
        isPage:     'self::div[@id = "yschpri"]',
    },
]);

SiteInfoSet.Paragraphs = paragraphs;
