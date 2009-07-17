Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules();

const EXPORTED_SYMBOLS = [];

let paragraphs = new SiteInfoSet("domain");

paragraphs.addData([
    { // Google Web Search
        domain:     /^http:\/\/www\.google(?:\.\w+){1,2}\/search\?/,
        paragraph:  'id("res")/div/ol/li[contains(concat(" ", @class, " "), " g ")]',
        link:       'descendant::a[contains(concat(" ", @class, " "), "l")]',
        //annotation: 'descendant::cite',
        annotation: 'descendant::span[@class = "gl"]',
        isPage:     'self::div[ol and parent::div[@id = "res"]]',
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
