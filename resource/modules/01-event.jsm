Components.utils.import("resource://hatenabookmark/modules/00_utils.jsm");

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
 * var l = EventService.createListener("DataUpdated", [obj, obj.method]);
 *
 * l.unlisten();
 */

var listenersSet = {};

var EventService = {
    createListener: function (type, handler, priority) {
        var object = null;
        if (typeof handler.handleEvent === "function")
            [object, handler] = [handler, handler.handleEvent];
        else if (Object.prototype.toString.call(handler) === "[object Array]")
            [object, handler] = handler;
        var listener = new Listener(type, object, handler, priority || 0);
        listener.listen();
        return listener;
    },

    dispatchEvent: function (event) {
        var listeners = listenersSet[event.type];
        if (!listeners) return true;
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener.handler.call(listener.object || EventService, event);
            if (event.isPropagationStopped) break;
        }
        return !event.isDefaultPrevented;
    },

    dispatch: function (type, data) {
        var event = new Event(type, data);
        return EventService.dispatchEvent(event);
    },

    reset: function () {
        listenersSet = {};
    }
};

function Listener(type, object, handler, priority) {
    this.type = type;
    this.object = object;
    this.handler = handler;
    this.priority = priority;
}

extend(Listener.prototype, {
    listen: function () {
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
    unlisten: function () {
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
    stopPropagation: function () {
        this.isPropagationStopped = true;
    },
    preventDefault: function () {
        this.isDefaultPrevented = true;
    }
});

Event.prototype.stop = Event.prototype.stopPropagation;
Event.prototype.cancel = Event.prototype.preventDefault;
