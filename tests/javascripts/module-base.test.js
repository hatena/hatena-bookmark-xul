var resFile = null;

function warmUp() {
    Components.utils.import("resource://hatenabookmark/modules/base.jsm");

    var resProtocol = Cc["@mozilla.org/network/protocol;1?name=resource"].
                      getService(Ci.nsIResProtocolHandler);
    var resSubst = resProtocol.getSubstitution("hatenabookmark");
    resFile = utils.getFileFromURL(resSubst);
    resFile.append("modules");
    resFile.append("Foo");
    resFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
    resFile.append("Bar.jsm");
    utils.writeTo(<![CDATA[
        const EXPORTED_SYMBOLS = ["Bar"];
        var Bar = { foo: 42 };
        var Baz = { foo: 12 };
    ]]>.toString(), resFile, "utf-8");
}

function coolDown() {
    if (resFile)
        utils.scheduleToRemove(resFile.parent);
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
    require("Foo.Bar");
    assert.equals(typeof Foo, "object");
    assert.equals(Foo.Bar.foo, 42);
    assert.isUndefined(Foo.Baz);

    var root = {
        require: require,
        Foo: {
            Bar: { qux: 31 }
        }
    };
    var imported = root.require("Foo.Bar");
    assert.isTrue(imported === root.Foo.Bar);
    assert.equals(root.Foo.Bar.foo, 42);
    assert.equals(root.Foo.Bar.qux, 31);
}

function testExtendNative() {
    var global = (function () this)();
    extendNative(global);

    assert.isFunction(Array.prototype.find);
    assert.equals([24, 32, 17, 8, 33].find(function (n) n & 1), 17);
}
