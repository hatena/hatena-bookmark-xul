(function () {

/**
 * RemoteCommand のテスト
 */

var modules = {};
Components.utils.import("resource://hatenabookmark/modules/82-RemoteCommand.js", modules);

QUnit.module("RemoteCommand");

// autoload の代わり
// 必要なのか?
hBookmark.loadModules();
hBookmark.load("chrome://hatenabookmark/content/common/");
//hBookmark.load("chrome://hatenabookmark/content/browser/");

let lastOpendURI = null;
var createXHRMock = (function (errors) {
    // @param errors XHR 内でのエラー発生時に記録する用の配列; null でもいい
    var XHRMock = function () {
        this._errors = errors || [];
        this._typeListenersMapOnBubbling = {};
        this._typeListenersMapOnCapturing = {};
    };
    XHRMock.prototype.open = function (method, uri, doAsync) {
        lastOpendURI = uri;
    };
    XHRMock.prototype.send = function () {
        var that = this;
        setTimeout(function () {
            // response を用意
            that.readyState = 4;
            that.status = 200;
            that.responseText = "{}";
            // ん?
            if (that.onreadystatechange) {
                that.onreadystatechange();
            }
            that.__dispatchEvent("load", that);
        }, 50);
    };
    XHRMock.prototype.__dispatchEvent = function (type, evtDetail) {
        var evt = { type: type };
        var that = this;
        var listeners = [];
        if (this._typeListenersMapOnCapturing[type]) {
            listeners = listeners.concat(this._typeListenersMapOnCapturing[type]);
        }
        if (this._typeListenersMapOnBubbling[type]) {
            listeners = listeners.concat(this._typeListenersMapOnBubbling[type]);
        }
        listeners.forEach(function (listener) {
            try {
                if (typeof listener === "function") {
                    listener(evt);
                } else if (listener.handleEvent) {
                    listener.handleEvent(evt);
                }
            } catch (err) {
                that._errors.push(err);
            }
        });
    };
    XHRMock.prototype.__addEventListener = function (type, listener, map) {
        var alreadyContained = false;
        if (!map[type]) {
            map[type] = [];
        } else {
            var fl = map[type].filter(function (l) { return l === listener });
            alreadyContained = (fl.length > 0);
        }
        if (!alreadyContained) map[type].push(listener);
    };
    XHRMock.prototype.addEventListener = function (type, listener, useCapture) {
        var map = (useCapture ? this._typeListenersMapOnBubbling
                              : this._typeListenersMapOnCapturing);
        this.__addEventListener(type, listener, map);
    };
    XHRMock.prototype.setRequestHeader = function () {
    };
    return XHRMock;
});

QUnit.asyncTest("コマンド edit の実行", 4, function () {
    let isComplete = false, isError = false;
    let cmd = new modules.RemoteCommand("edit", {
        user: { name: "foo", rks: "bar" },
        onComplete: function () isComplete = true,
        onError: function () isError = true
    });
    var callbackErrors = [];
    cmd._MyXMLHttpRequest = createXHRMock(callbackErrors);
    cmd.execute();

    setTimeout(function () {
        equal(isComplete, true);
        equal(isError, false);
        // editer=fxaddon がクエリパラメータとして追加される
        equal(lastOpendURI, "http://b.hatena.ne.jp/foo/add.edit.json" + "?editer=fxaddon");
        equal(callbackErrors.length, 0);

        QUnit.start();
    }, 100);
});

}).call(this);
