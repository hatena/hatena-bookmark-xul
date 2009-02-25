
var _global = this;
var hBookmark;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/unknown.xul");
    hBookmark = global.hBookmark;
    hBookmark.extend(_global, hBookmark);
}


function createObj()
{
    let o = {
        foo: 'foo',
        get getterFoo() this.foo,
        set setterFoo(val) this.foo = val,
        getFoo: function() this.foo,
    };
    return o;
}

function testDelegator()
{
    let obj = createObj();
    let d = new Delegator(obj, false);
    assert.equals(obj.foo, d.getFoo());
    assert.notEquals(obj.foo, d.foo);

    d = new Delegator(obj);
    assert.equals(obj.foo, d.getFoo());
    assert.equals(obj.foo, d.foo);
    assert.equals(obj.foo, d.getterFoo);
}

