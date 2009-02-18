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
 * var l = EventService.createListener("DataUpdated", obj.method, obj);
 *
 * l.unlisten();
 */

var listenersSet = {};

var EventService = {
    createListener: function (type, handler, object) {
        if (typeof handler.handleEvent === "function") {
            object = handler;
            handler = handler.handleEvent;
        }
        var listener = new Listener(type, handler, object);
        listener.listen();
        return listener;
    },

    dispatchEvent: function (event) {
        var listeners = listenersSet[event.type];
        if (!listeners) return true;
        listeners.concat().forEach(function (listener) {
            listener.handler.call(listener.object || EventService, event);
        });
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

function Listener(type, handler, object) {
    this.type = type;
    this.handler = handler;
    this.object = object;
}

extend(Listener.prototype, {
    listen: function () {
        var listeners = listenersSet[this.type] ||
                        (listenersSet[this.type] = []);
        listeners.push(this);
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
    this.isDefaultPrevented = false;
}

extend(Event.prototype, {
    preventDefault: function () {
        this.isDefaultPrevented = true;
    },
    stopPropagation: function () {}
});
