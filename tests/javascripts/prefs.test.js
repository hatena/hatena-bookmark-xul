
var _global = this;
var hBookmark;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/unknown.xul");
    hBookmark = global.hBookmark;
    hBookmark.extend(_global, hBookmark);
}

function setUp() {
    utils.setPref('extentions.hatenabookmark.strfoo', 'foo');
    utils.setPref('extentions.hatenabookmark.strbar', 'bar');
    utils.setPref('extentions.hatenabookmark.intbar', 3);
    utils.setPref('extentions.hatenabookmark.bar', 'bar');
    utils.setPref('toplevel.bar', 'foo');
    Prefs.global.register();
    Prefs.bookmark.register();
}

function tearDown() {
    Prefs.global.unregister();
    Prefs.bookmark.unregister();
}


function testPref()
{
    assert.equals('foo', Prefs.bookmark.get('strfoo'));
    assert.equals(3, Prefs.bookmark.get('intbar'));
    assert.equals('bar', Prefs.bookmark.get('bar'));
    Prefs.bookmark.set('setstrbar', 'string');
    assert.equals(utils.getPref('extentions.hatenabookmark.setstrbar'), 'string');
    Prefs.bookmark.set('setbarint', 4);
    assert.equals(utils.getPref('extentions.hatenabookmark.setbarint'), 4);
    Prefs.global.clear('toplevel.bar');
    assert.isFalse(Prefs.global.get('toplevel.bar'));
}

function testObserve() {
    var loaded = { value: false };
    var loaded2 = { value: false };
    Prefs.bookmark.createListener('strfoo', function(e) {
        loaded.value = true;
    });
    Prefs.global.createListener('extentions.hatenabookmark.strfoo', function(e) {
        loaded2.value = true;
    });
    utils.setPref('extentions.hatenabookmark.strfoo', 'change');
    yield loaded;
    yield loaded2;
}

