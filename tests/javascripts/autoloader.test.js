var hBookmark = null;
var scriptDir = null;

function warmUp() {
    utils.include("btil.js");

    const EXTENSION_ID = "bookmark@hatena.ne.jp";
    var em = Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager);
    var location = em.getInstallLocation(EXTENSION_ID);
    var srcFile = location.getItemFile(EXTENSION_ID, "tests/javascripts/autoloader-test");
    var destDir = location.getItemFile(EXTENSION_ID, "chrome/content");
    scriptDir = utils.cosmeticClone(srcFile, destDir, "autoloader-test");
    utils.dump(String(scriptDir));
}

function coolDown() {
    utils.dump(String(scriptDir));
    if (scriptDir)
        utils.scheduleToRemove(scriptDir);
}

function setUp() {
    var global = loadAutoloader("chrome://hatenabookmark/content/autoloader-test.xul");
    hBookmark = global.hBookmark;
}

function testModuleLoaded() {
    assert.isDefined(hBookmark.Foo);
    assert.equals(hBookmark.Foo.baz, 42);
    assert.isUndefined(hBookmark.Bar);
}

function testGetScriptPaths() {
    var paths = hBookmark.load.getScriptURIs("chrome://hatenabookmark/content/autoloader-test/");
    assert.equals(paths, ["chrome://hatenabookmark/content/autoloader-test/01_foo.js"]);
}
