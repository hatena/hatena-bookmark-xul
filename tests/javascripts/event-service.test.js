
function warmUp() {
    Components.utils.import("resource://hatenabookmark/modules/10-event.jsm");
}

function setUp() {
    EventService.resetListeners();
}

function testEventService() {
    var result = false;
    function f() { result = true; }
    EventService.createListener("EventDispatched", f);
    EventService.dispatch("EventDispatched");
    assert.equals(result, true);
}

function testMultipleListener() {
    var result = [];
    EventService.createListener("AnEvent", function () result.push(1));
    EventService.createListener("AnotherEvent", function () result.push(2));
    EventService.createListener("AnEvent", function () result.push(3));
    EventService.dispatch("AnEvent");
    assert.equals(result, [1, 3]);
}

function testListenerMethods() {
    var result = false;
    function f() result = true;
    var listener = EventService.createListener("EventDispatched", f);

    listener.unlisten();
    EventService.dispatch("EventDispatched");
    assert.equals(result, false);

    result = false;
    listener.listen();
    EventService.dispatch("EventDispatched");
    assert.equals(result, true);
}

function testDOMEventListenerInterface() {
    var result = false;
    var listenerOjbect = { handleEvent: function () result = true };
    EventService.createListener("EventDispatched", listenerOjbect);
    EventService.dispatch("EventDispatched");
    assert.equals(result, true);
}

function testEventData() {
    var result = false;
    EventService.createListener("EventDispatched", function (event) {
        result = event.data;
    });
    EventService.dispatch("EventDispatched", true);
    assert.equals(result, true);
}

function testPreventDefault() {
    EventService.createListener("EventDispatched", function (event) {
        event.preventDefault();
    });
    var result = EventService.dispatch("EventDispatched");
    assert.equals(result, false);
}

function testStopPropagation() {
    var result = [];
    EventService.createListener("EventDispatched", function () result.push(1));
    EventService.createListener("EventDispatched", function (event) {
        result.push(2);
        event.stopPropagation();
    });
    EventService.createListener("EventDispatched", function () result.push(3));
    EventService.dispatch("EventDispatched");
    assert.equals(result, [1, 2]);
}

function testLockKey() {
    var result = [];
    var listeners = [
        EventService.createListener("Event", function () result.push(1), "foo"),
        EventService.createListener("Event", function () result.push(2), null),
        EventService.createListener("Event", function () result.push(3), "foo"),
        EventService.createListener("Event", function () result.push(4), "bar"),
    ];
    EventService.dispatch("Event");
    assert.equals(result, [1, 2, 4]);
    listeners.forEach(function (l) l.unlisten());
}

function testPriority() {
    var result = [];
    EventService.createListener("AnEvent", function () result.push(1));
    EventService.createListener("AnEvent", function () result.push(2), null, 0);
    EventService.createListener("AnEvent", function () result.push(3), null, 2);
    EventService.createListener("AnEvent", function () result.push(4), null, 1);
    EventService.createListener("AnEvent", function () result.push(5), null, 2);
    EventService.createListener("AnEvent", function () result.push(6), null, 1);
    EventService.dispatch("AnEvent");
    assert.equals(result, [3, 5, 4, 6, 1, 2]);
}

function testMultipleListenerMethodCall() {
    var result = [];
    var listener = EventService.createListener("AnEvent", function () result.push(1));
    listener.listen();
    listener.listen();
    EventService.dispatch("AnEvent");
    assert.equals(result, [1]);

    listener.unlisten();
    EventService.dispatch("AnEvent");
    assert.equals(result, [1]);
}

//// XXX getTestWindow()の返り値がnullになる。
//testDisposable.priority = "never";
//function testDisposable() {
//    const EXTENSION_ID = "bookmark@hatena.ne.jp";
//    const em = Cc["@mozilla.org/extensions/manager;1"]
//               .getService(Ci.nsIExtensionManager);
//    let location = em.getInstallLocation(EXTENSION_ID);
//    let srcFile = location.getItemFile(EXTENSION_ID, "tests/javascripts/event-service-test.xul");
//    let destDir = location.getItemFile(EXTENSION_ID, "chrome/content");
//    let copiedFile = utils.cosmeticClone(srcFile, destDir, srcFile.leafName);
//    yield 200;
//
//    let result, win;
//
//    yield utils.setUpTestWindow(function () {}, {
//        uri: "chrome://hatenabookmark/content/event-service-test.xul"
//    });
//    result = false;
//    win = utils.getTestWindow();
//    win.callback = function () result = true;
//    win.createDisposableListener();
//    EventService.dispatch("AnEvent");
//    assert.equals(result, true);
//
//    utils.closeTestWindow();
//    result = false;
//    EventService.dispatch("AnEvent");
//    assert.equals(result, false);
//
//    let listener;
//
//    yield utils.setUpTestWindow(function () {}, {
//        uri: "chrome://hatenabookmark/content/event-service-test.xul"
//    });
//    result = false;
//    win = utils.getTestWindow();
//    win.callback = function () result = true;
//    listener = win.createNonDisposableListener();
//    EventService.dispatch("AnEvent");
//    assert.equals(result, true);
//
//    utils.closeTestWindow();
//    result = false;
//    EventService.dispatch("AnEvent");
//    assert.equals(result, true);
//
//    listener.unlisten();
//    result = false;
//    EventService.dispatch("AnEvent");
//    assert.equals(result, false);
//
//    utils.scheduleToRemove(copiedFile);
//}

function testImplement() {
    var dispatcher = {};
    var ret = EventService.implement(dispatcher);
    assert.isTrue(ret === dispatcher);
    assert.isFunction(dispatcher.createListener);
    result = false;
    dispatcher.createListener("AnEvent", function () result = true);
    EventService.dispatch("AnEvent");
    assert.equals(result, false);
    dispatcher.dispatch("AnEvent");
    assert.equals(result, true);
}
