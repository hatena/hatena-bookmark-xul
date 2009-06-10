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
    assert.equals(
        "http://b.hatena.ne.jp/guide/staff_bookmark_04",
        hBookmark.suggestors.meta("http://b.hatena.ne.jp/entry/http://b.hatena.ne.jp/guide/staff_bookmark_04", null))
    assert.equals(
        null,
        hBookmark.suggestors.meta("http://b.hatena.ne.jp/entry/12345", null))
}
