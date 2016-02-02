var hBookmark;

function warmUp() {
    utils.include("btil.js");
    let g = loadAutoloader("chrome://hatenabookmark/content/unknown.js");
    hBookmark = g.hBookmark;
}

function testGet() {
    let uriSpec = baseURL + "Strings.test.properties";
    let strings = new hBookmark.Strings(uriSpec);
    assert.equals("Hello, world!", strings.get("hello"));
    assert.equals("Hello, Strings world!",
                  strings.get("helloSomething", ["Strings"]));
}
