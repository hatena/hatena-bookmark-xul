
var _global = this;
var hBookmark;

function warmUp() {
    utils.include("btil.js");
    var global = loadAutoloader("chrome://hatenabookmark/content/sidebar.xul");
    hBookmark = global.hBookmark;
    //hBookmark.extend(_global, hBookmark);
}


function createObj()
{
    //let o = {
    //    foo: 'foo',
    //    get getterFoo() this.foo,
    //    set setterFoo(val) this.foo = val,
    //    getFoo: function() this.foo,
    //};
    //o.prototype = {
    //    foo: 'bar',
    //    baz: '10',
    //}
    //return o;
}

function testDelegator()
{
    assert.equals(1,1);
    //let obj = createObj();
    //let d = new Delegator(obj);
    //assert.equals(obj.foo, d.getFoo());
}

