
function warmUp() {
    Components.utils.import("resource://hatenabookmark/modules/01-event.jsm");
}

function setUp() {
    EventService.reset();
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

function testMethodAsListener() {
    var result = false;
    var object = {
        property: true,
        method: function () result = this.property
    };
    EventService.createListener("EventDispatched", [object, object.method]);
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

function testPriority() {
    var result = [];
    EventService.createListener("AnEvent", function () result.push(1));
    EventService.createListener("AnEvent", function () result.push(2), 0);
    EventService.createListener("AnEvent", function () result.push(3), 2);
    EventService.createListener("AnEvent", function () result.push(4), 1);
    EventService.createListener("AnEvent", function () result.push(5), 2);
    EventService.createListener("AnEvent", function () result.push(6), 1);
    EventService.dispatch("AnEvent");
    assert.equals(result, [3, 5, 4, 6, 1, 2]);
}
