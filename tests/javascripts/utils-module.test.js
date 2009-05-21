var moduleFile = null;

function warmUp() {
    Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");

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

function testBindMethod() {
    let f = function(arg) {
        return this.foo + arg;
    };
    assert.equals(bind(f, {foo: 1})(0), 1);
    assert.equals(bind(f, {foo: 1})(1), 2);
    let f1 = new function() {
        this.bar = 1;
        this.callBar = function() this.bar;
    };
    assert.equals(f1.callBar(), 1);
    assert.equals(method(f1, 'callBar')(), 1);
    assert.equals(method(f1, 'callBar').apply({bar: 2}), 1);
}

function testJSON() {
    assert.equals({ foo: 42 }, decodeJSON('{ "foo": 42 }'));
    assert.equals(null, decodeJSON('<error>'));

    assert.equals('[23,42]', encodeJSON([23, 42]));
}

/*
function testExtendBuiltIns() {
    extendBuiltIns();

    assert.isFunction(Array.prototype.find);
    assert.equals([24, 32, 17, 8, 33].find(function (n) n & 1), 17);
}
*/

function testDecodeReferences() {
    assert.equals("\u00abHello &unknown; <world>\u00bb",
                  decodeReferences("&laquo;H&#101;llo &unknown; &lt;&#x77;orld&gt;&raquo;"));
}

function testIRI() {
    var iri = "http://日本語.jp/天気";
    assert.equals("http://xn--wgv71a119e.jp/%E5%A4%A9%E6%B0%97",
                  iri2uri(iri));
    assert.equals("http%3A%2F%2Fxn--wgv71a119e.jp%2F%25E5%25A4%25A9%25E6%25B0%2597",
                  escapeIRI(iri));
}
