var moduleFile = null;

function warmUp() {
    Components.utils.import("resource://hatenabookmark/modules/00_utils.jsm");

    var resProtocol = Cc["@mozilla.org/network/protocol;1?name=resource"].
                      getService(Ci.nsIResProtocolHandler);
    var resSubst = resProtocol.getSubstitution("hatenabookmark");
    moduleFile = utils.getFileFromURL(resSubst);
    moduleFile.append("modules");
    moduleFile.append("01_foo.jsm");
    utils.writeTo(<![CDATA[
        const EXPORTED_SYMBOLS = ["Foo"];
        var Foo = { baz: 42 };
        var Bar = { baz: 12 };
    ]]>.toString(), moduleFile, "utf-8");
}

function coolDown() {
    if (moduleFile)
        utils.scheduleToRemove(moduleFile);
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

function testLoadModules() {
    loadModules();
    assert.equals(typeof Foo, "object");
    assert.equals(Foo.baz, 42);
    assert.equals(typeof Bar, "undefined");

    var root = { loadModules: loadModules };
    root.loadModules();
    assert.equals(root.Foo.baz, 42);
}

/*
function testExtendBuiltIns() {
    extendBuiltIns();

    assert.isFunction(Array.prototype.find);
    assert.equals([24, 32, 17, 8, 33].find(function (n) n & 1), 17);
}
*/
