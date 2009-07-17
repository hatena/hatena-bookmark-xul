const EXPORT = "queryXPath queryXPathAll xml2dom".split(" ");

/* XXX To be impemented */
/*
function queryXPath(xpath, context, resultType);
function queryXPathAll(xpath, context);
*/

// XXX ToDo: optionsでrangeを指定できるようにしたい
function xml2dom(xml, options) {
    options = extend({
        prettyPrinting: false,
    }, options);
    let prevSettings = XML.settings();
    XML.setSettings(options);
    let doc = options.document || document;
    let range = doc.createRange();
    range.selectNodeContents(options.context || doc.documentElement);
    let result = range.createContextualFragment(xml.toXMLString());
    XML.setSettings(prevSettings);
    return result;
}
