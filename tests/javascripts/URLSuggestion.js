let hBookmark;

function warmUp() {
    utils.include("btil.js");
    let global = loadAutoloader("chrome://hatenabookmark/content/addPanel.xml");
    hBookmark = global.hBookmark;
    // EXPORT に含まれていないメンバもテストするため直接読み込む。
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
              .getService(Components.interfaces.mozIJSSubScriptLoader)
              .loadSubScript("chrome://hatenabookmark/content/addPanel/20-URLSuggestion.js", hBookmark);
}

function testEffectiveDomain() {
    assert.isTrue(hBookmark.isSameEffectiveDomain(
        "http://www.hatena.ne.jp/",
        "http://b.hatena.ne.jp/"));
    assert.isFalse(hBookmark.isSameEffectiveDomain(
        "http://www.hatena.ne.jp/",
        "http://www.goo.ne.jp/"));
}

function testMetaSuggestor() {
    let suggestors = hBookmark.URLSuggestion.suggestors;
    assert.equals(
        "http://b.hatena.ne.jp/guide/staff_bookmark_04",
        suggestors.meta("http://b.hatena.ne.jp/entry/http://b.hatena.ne.jp/guide/staff_bookmark_04", null))
    assert.equals(
        null,
        suggestors.meta("http://b.hatena.ne.jp/entry/12345", null))
}

function testCanonicalResponseSuggestor() {
    let suggestor = hBookmark.URLSuggestion.responseSuggestors.canonical;
    let response = {
        responseText: <html>
            <head>
                <link rel="canonical" href="http://example.org/canonical"/>
            </head>
            <body>
                <p>Hello, world</p>
            </body>
        </html>.toXMLString()
    }
    assert.equals("http://example.org/canonical",
                  suggestor("http://example.org/", response));

    response.responseText = <html>
        <head>
            <link href="canonical-url" rel="canonical"/>
        </head>
        <body>
            <p>Hello, world</p>
        </body>
    </html>.toXMLString();
    assert.equals("http://example.org/canonical-url",
                  suggestor("http://example.org/", response));
    assert.equals("http://example.org/canonical-url#fragment",
                  suggestor("http://example.org/#fragment", response));
}
