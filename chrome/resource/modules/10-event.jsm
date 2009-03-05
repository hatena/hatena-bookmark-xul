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

var EventService = new EventDispatcher();

EventService.implement = function ES_implement(target) {
    extend(target, EventDispatcher.prototype, false);
    EventDispatcher.call(target);
    return target;
};

// XXX ToDo: unlisten/resetメソッドとdisposableなリスナの関係を整理する。

function EventDispatcher() {
    this._listenersSet = {};
}

extend(EventDispatcher.prototype, {
    createListener: function ED_createListener(type, handler, lockKey,
                                               priority, disposable) {
        if (typeof handler.handleEvent === "function")
            handler = method(handler, "handleEvent");
        let listener =
            new Listener(this, type, handler, lockKey || "", priority || 0);
        let scope;
        if ((arguments.length < 5 || disposable) &&
            (scope = arguments.callee.caller))
            addDisposableListener(listener, scope);
        listener.listen();
        return listener;
    },

    dispatchEvent: function ED_dispatchEvent(event) {
        var listeners = this._listenersSet[event.type];
        if (!listeners) return true;
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener.handler(event);
            if (event.isPropagationStopped) break;
        }
        return !event.isDefaultPrevented;
    },

    dispatch: function ED_dispatch(type, data) {
        var event = new Event(type, data);
        return this.dispatchEvent(event);
    },

    resetListeners: function ED_resetListeners() {
        this._listenersSet = {};
    }
});

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

function Listener(dispatcher, type, handler, lockKey, priority) {
    this.dispatcher = dispatcher;
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
        var listeners = this.dispatcher._listenersSet[this.type] ||
                        (this.dispatcher._listenersSet[this.type] = []);
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
        var listeners = this.dispatcher._listenersSet[this.type];
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
