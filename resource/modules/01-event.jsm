Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");

const EXPORTED_SYMBOLS = ["EventService"];

/* var l = EventService.createListener("DataUpdated", function () { ... });
 *
 * var eventListener = {
 *     handleEvent: function (event) {
 *         alert(event.data);
 *     }
 * };
 * var l = EventService.createListener("DataUpdated", eventListener);
 *
 * l.unlisten();
 */

let listenersSet = {};

var EventService = {
    createListener: function ES_createListener(type, handler, lockKey,
                                               priority, disposable) {
        if (typeof handler.handleEvent === "function")
            handler = method(handler, "handleEvent");
        let listener =
            new Listener(type, handler, lockKey || "", priority || 0);
        let scope;
        if ((arguments.length < 5 || disposable) &&
            (scope = arguments.callee.caller))
            addDisposableListener(listener, scope);
        listener.listen();
        return listener;
    },

    dispatchEvent: function ES_dispatchEvent(event) {
        var listeners = listenersSet[event.type];
        if (!listeners) return true;
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener.handler(event);
            if (event.isPropagationStopped) break;
        }
        return !event.isDefaultPrevented;
    },

    dispatch: function ES_dispatch(type, data) {
        var event = new Event(type, data);
        return EventService.dispatchEvent(event);
    },

    reset: function ES_reset() {
        listenersSet = {};
    }
};

let disposableEntries = [];

function addDisposableListener(listener, scope) {
    while (scope.__proto__)
        scope = scope.__proto__;
    let window = scope.__parent__ || scope;
    if (!window.addEventListener) return;
    let listeners = null;
    disposableEntries.some(function (entry) {
        if (entry.window !== window) return false;
        listeners = entry.listeners;
        return true;
    });
    if (!listeners)
        addDisposer(window, listeners = []);
    listeners.push(listener);
}

function addDisposer(window, listeners) {
    let entry = { window: window, listeners: listeners };
    disposableEntries.push(entry);
    window.addEventListener("unload", function ES_dispose() {
        listeners.forEach(function (l) l.unlisten());
        let i = disposableEntries.indexOf(entry);
        if (i !== -1) disposableEntries.splice(i, 1);
        window.removeEventListener("unload", arguments.callee, false);
        p("unlistened " + listeners.length + " listeners");
    }, false);
}

let locked = {};

function Listener(type, handler, lockKey, priority) {
    this.type = type;
    this.handler = handler;
    this.lockKey = lockKey;
    this.priority = priority;
    this.isListening = false;
}

extend(Listener.prototype, {
    listen: function Listener_listen() {
        if (this.isListening || (this.lockKey && locked[this.lockKey])) return;
        locked[this.lockKey] = true;
        this.isListening = true;
        var listeners = listenersSet[this.type] ||
                        (listenersSet[this.type] = []);
        if (this.priority) {
            for (var i = 0; i < listeners.length; i++)
                if (listeners[i].priority < this.priority)
                    break;
            listeners.splice(i, 0, this);
        } else {
            listeners.push(this);
        }
    },

    unlisten: function Listener_unlisten() {
        if (!this.isListening) return;
        this.isListening = false;
        locked[this.lockKey] = false;
        var listeners = listenersSet[this.type];
        var i;
        if (listeners && (i = listeners.indexOf(this)) !== -1)
            listeners.splice(i, 1);
    }
});

function Event(type, data) {
    this.type = type;
    this.data = data;
    this.isPropagationStopped = false;
    this.isDefaultPrevented = false;
}

extend(Event.prototype, {
    stop: function Event_stop() {
        this.isPropagationStopped = true;
    },
    cancel: function Event_cancel() {
        this.isDefaultPrevented = true;
    }
});

Event.prototype.stopPropagation = Event.prototype.stop;
Event.prototype.preventDefault = Event.prototype.cancel;
