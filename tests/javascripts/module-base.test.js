function warmUp() {
    Components.utils.import("resource://hatenabookmark/modules/base.jsm");
}

function testExtend() {
    var o = { bar: 0 };
    extend(o, {
        _foo: "",
        get foo () this._foo.toUpperCase(),
        set foo (val) this._foo = val + "",
        bar: 42
    });
    o.foo = "hello";
    assert.equals(o.foo, "HELLO");
    assert.equals(o.bar, 42);

    extend(o, { bar: 12 }, false);
    assert.equals(o.bar, 42);
}

function testRequire() {
    var resProtocol = Cc["@mozilla.org/network/protocol;1?name=resource"].
                      getService(Ci.nsIResProtocolHandler);
    var resSubst = resProtocol.getSubstitution("hatenabookmark");
    var resFile = utils.getFileFromURL(resSubst);
    resFile.append("modules");
    resFile.append("Foo");
    resFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
    resFile.append("Bar.jsm");
    utils.writeTo(<![CDATA[
        const EXPORTED_SYMBOLS = ["Bar"];
        var Bar = { foo: 42 };
        var Baz = { foo: 12 };
    ]]>.toString(), resFile, "utf-8");

    var hBookmark = {};
    require(hBookmark, "Foo.Bar");
    assert.isDefined(hBookmark.Foo.Bar);
    assert.equals(hBookmark.Foo.Bar.foo, 42);
    assert.isUndefined(hBookmark.Foo.Baz);

    utils.scheduleToRemove(resFile.parent);
}

function testExtendNative() {
    var global = (function () this)();

    assert.equals([24, 32, 17, 8, 33].find(function (n) n & 1), 17);
}
