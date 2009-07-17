Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules();

const EXPORTED_SYMBOLS = [];

let paragraphs = new SiteInfoSet("domain");

paragraphs.addData([
    {
        domain:     /^http:\/\/www\.google(?:\.\w+){1,2}\/search\?/,
        paragraph:  'id("res")/div/ol/li[contains(concat(" ", @class, " "), " g ")]',
        link:       'descendant::a[contains(concat(" ", @class, " "), "l")]',
        //annotation: 'descendant::cite',
        annotation: 'descendant::span[@class = "gl"]',
        annotationPosition: "last",
        isPage:     'self::div[ol and parent::div[@id = "res"]]',
    },
]);

SiteInfoSet.Paragraphs = paragraphs;
