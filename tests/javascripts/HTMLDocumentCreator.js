let hBookmark;

function warmUp() {
    utils.include("btil.js");
    let g = loadAutoloader("chrome://hatenabookmark/content/unknown.xul");
    hBookmark = g.hBookmark;
}

function testFromString() {
    let source = '<html><head> \
        <meta http-equiv="Content-Type" content="text/html">\n\
        <title>hello</title>\
        <body>  \
        world \
        <p>&nbsp;</p> ';
    let doc = hBookmark.HTMLDocumentCreator.fromString(source);
    assert.isTrue(doc instanceof Ci.nsIDOMHTMLDocument);
    assert.is('hello', doc.title);
    assert.isTrue(doc.body instanceof Ci.nsIDOMHTMLBodyElement);
    assert.is(Ci.nsIDOMNode.TEXT_NODE, doc.body.firstChild.nodeType);
    assert.is('world', doc.body.firstChild.nodeValue.replace(/\s+/g, ''));
    let paras = doc.getElementsByTagName('p');
    assert.is(1, paras.length);
    assert.is('\u00a0', paras[0].textContent);
}
