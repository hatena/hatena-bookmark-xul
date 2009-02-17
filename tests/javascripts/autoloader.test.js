var global = {
    location: {
        href: "chrome://hatenabookmark/content/sidebar.xul",
        pathname: "/content/sidebar.xul"
    }
};

function warmUp() {
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader)
        .loadSubScript("chrome://hatenabookmark/content/autoloader.js", global);
}

function testExtend() {
    var extend = global.hBookmark.utils.extend;
    assert.isFunction(extend);

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

function testGetScriptPaths() {
    var paths = global.hBookmark.load.getScriptURIs("/content/sidebar/");
    assert.equals(paths, ["chrome://hatenabookmark/content/sidebar/20-sidebar.js"]);
}
