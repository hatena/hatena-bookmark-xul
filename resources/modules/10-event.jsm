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

function EventDispatcher() {
    this._listenersSet = {};
}

extend(EventDispatcher.prototype, {
    createListener: function ED_createListener(type, handler, lockKey,
                                               priority, disposable) {
        var originalHandler = handler;
        if (typeof handler.handleEvent === "function")
            handler = method(handler, "handleEvent");
        let window = (arguments.length < 5 || disposable)
                     ? getWindowForObject(originalHandler) : null;
        let listener = new Listener(this, type, handler,
                                    lockKey || "", priority || 0, window);
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
        event.target = this;
        return this.dispatchEvent(event);
    },

    resetListeners: function ED_resetListeners() {
        this._listenersSet = {};
    }
});

function getWindowForObject(object) {
    if (!object) return null;
    let window;
    if (Cu.getGlobalForObject) {
        window = Cu.getGlobalForObject(object);
    } else {
        while (object.__proto__)
            object = object.__proto__;
        window = object.__parent__;
    }
    return (window && window.addEventListener) ? window : null;
}

let disposableEntries = [];

function addDisposableListener(listener, window) {
    let entry = getDisposableEntry(window);
    if (!entry) {
        entry = { window: window, listeners: [] };
        disposableEntries.push(entry);
        window.addEventListener("unload", function ES_dispose() {
            p("unlisten " + entry.listeners.length + " listeners");
            entry.listeners.concat().forEach(function (l) l.unlisten());
            disposableEntries.splice(disposableEntries.indexOf(entry), 1);
            window.removeEventListener("unload", ES_dispose, false);
        }, false);
    }
    entry.listeners.push(listener);
}

function removeDisposableListener(listener, window) {
    let entry = getDisposableEntry(window);
    if (!entry) return;
    let index = entry.listeners.indexOf(listener);
    if (index === -1) return;
    entry.listeners.splice(index, 1);
}

function getDisposableEntry(window) {
    for (let i = 0; i < disposableEntries.length; i++) {
        let entry = disposableEntries[i];
        if (entry.window === window)
            return entry;
    }
    return null;
}

let locked = {};

function Listener(dispatcher, type, handler, lockKey, priority, window) {
    this.dispatcher = dispatcher;
    this.type = type;
    this.handler = handler;
    this.lockKey = lockKey;
    this.priority = priority;
    this.window = window;
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
        if (this.window)
            addDisposableListener(this, this.window);
    },

    unlisten: function Listener_unlisten() {
        if (!this.isListening) return;
        this.isListening = false;
        locked[this.lockKey] = false;
        var listeners = this.dispatcher._listenersSet[this.type];
        var i;
        if (listeners && (i = listeners.indexOf(this)) !== -1)
            listeners.splice(i, 1);
        if (this.window)
            removeDisposableListener(this, this.window);
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
