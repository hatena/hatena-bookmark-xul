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

var lastOpendURI = null;
var createXHRMock = (function (options) {
    if (!options) options = {};
    /*
     * options のプロパティとしては以下のものがありえる (全てオプション)
     *   errors: 配列; エラーを記録するためのもの
     *   responseGenerator: レスポンスを生成する関数;
     *      引数として URL をとり, 返り値は { status: 200, responseText: "" } 形式のオブジェクト
     */

    var defaultResponseGenerator = function (uri) {
        return {
            status: 200,
            responseText: "",
        };
    };
    var responseGenerator = options.responseGenerator || defaultResponseGenerator;

    var XHRMock = function () {
        this._errors = options.errors || [];
        this._typeListenersMapOnBubbling = {};
        this._typeListenersMapOnCapturing = {};
    };
    XHRMock.prototype.open = function (method, uri, doAsync) {
        this._uri = uri;
        this._doAsync = doAsync;
        lastOpendURI = uri;
    };
    XHRMock.prototype.send = function () {
        var that = this;
        var proc = function () {
            // response を用意
            var res = responseGenerator(that._uri);
            that.readyState = 4;
            that.status = res.status;
            that.responseText = res.responseText;
            // ん?
            if (that.onreadystatechange) {
                that.onreadystatechange();
            }
            that.__dispatchEvent("load", that);
        };
        if (this._doAsync) {
            setTimeout(function () { proc() }, 10);
        } else {
            proc();
        }
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

QUnit.asyncTest("通信が正常に完了する場合 (edit コマンド; onComplete あり)", 5, function () {
    var pOrder = [];

    let cmd = new modules.RemoteCommand("edit", {
        user: { name: "foo", rks: "bar" },
        onComplete: function () {
            ok(true, "オプションで `onComplete` を渡した場合, 通信成功時にはそれが呼ばれる");
            pOrder.push(1);
        },
        onError: function () {
            ok(false, "オプションで `onError` を渡した場合, 通信成功時にはそれは呼ばれない");
            pOrder.push("NG");
        },
    });

    cmd.createListener("complete", function (evt) {
        ok(true, "complete イベントのリスナを登録していた場合, 通信成功時にはそれが呼ばれる");
        pOrder.push(2);
    });
    cmd.createListener("error", function (evt) {
        ok(false, "error イベントのリスナを登録していた場合, 通信成功時にはそれは呼ばれない");
        pOrder.push("NG");
    });

    var callbackErrors = [];
    cmd._MyXMLHttpRequest = createXHRMock({ errors: callbackErrors });
    cmd.execute();

    setTimeout(function () {
        // editer=fxaddon がクエリパラメータとして追加される
        equal(lastOpendURI, "http://b.hatena.ne.jp/foo/add.edit.json" + "?editer=fxaddon");
        equal(callbackErrors.length, 0);

        deepEqual(pOrder, [1,2]);

        QUnit.start();
    }, 100);
});

QUnit.asyncTest("通信が正常に完了する場合 (edit コマンド; onComplete なし)", 4, function () {
    var pOrder = [];

    let cmd = new modules.RemoteCommand("edit", {
        user: { name: "foo", rks: "bar" },
        onError: function () {
            ok(false, "オプションで `onError` を渡した場合, 通信成功時にはそれは呼ばれない");
            pOrder.push("NG");
        },
    });

    cmd.createListener("complete", function (evt) {
        ok(true, "complete イベントのリスナを登録していた場合, 通信成功時にはそれが呼ばれる");
        pOrder.push(1);
    });
    cmd.createListener("error", function (evt) {
        ok(false, "error イベントのリスナを登録していた場合, 通信成功時にはそれは呼ばれない");
        pOrder.push("NG");
    });

    var callbackErrors = [];
    cmd._MyXMLHttpRequest = createXHRMock({ errors: callbackErrors });
    cmd.execute();

    setTimeout(function () {
        // editer=fxaddon がクエリパラメータとして追加される
        equal(lastOpendURI, "http://b.hatena.ne.jp/foo/add.edit.json" + "?editer=fxaddon");
        equal(callbackErrors.length, 0);

        deepEqual(pOrder, [1]);

        QUnit.start();
    }, 100);
});

QUnit.asyncTest("通信が正常に完了しない場合 (edit コマンド; onError あり)", 5, function () {
    var pOrder = [];

    let cmd = new modules.RemoteCommand("edit", {
        user: { name: "foo", rks: "bar" },
        timeout: 0.040,
        onComplete: function () {
            ok(false, "オプションで `onComplete` を渡した場合, 通信失敗時にはそれは呼ばれない");
            pOrder.push("NG");
        },
        onError: function () {
            ok(true, "オプションで `onError` を渡した場合, 通信失敗時にはそれが呼ばれる");
            pOrder.push(1);
        },
    });

    cmd.createListener("complete", function (evt) {
        ok(false, "complete イベントのリスナを登録していた場合, 通信失敗時にはそれは呼ばれない");
        pOrder.push("NG");
    });
    cmd.createListener("error", function (evt) {
        ok(true, "error イベントのリスナを登録していた場合, 通信失敗時にはそれが呼ばれる");
        pOrder.push(2);
    });

    var callbackErrors = [];
    cmd._MyXMLHttpRequest = createXHRMock({
        errors: callbackErrors,
        responseGenerator: function (uri) {
            return {
                status: 500,
                responseText: "Server Error",
            };
        },
    });
    cmd.execute();

    setTimeout(function () {
        // editer=fxaddon がクエリパラメータとして追加される
        equal(lastOpendURI, "http://b.hatena.ne.jp/foo/add.edit.json" + "?editer=fxaddon");
        equal(callbackErrors.length, 0);

        deepEqual(pOrder, [1,2]);

        QUnit.start();
    }, 400); // 40 ms のタイムアウトで 3 回リトライするので長めに待つ必要がある
});

QUnit.asyncTest("通信が正常に完了しない場合 (edit コマンド; onError なし)", 4, function () {
    var pOrder = [];

    let cmd = new modules.RemoteCommand("edit", {
        user: { name: "foo", rks: "bar" },
        timeout: 0.040,
        onComplete: function () {
            ok(false, "オプションで `onComplete` を渡した場合, 通信失敗時にはそれは呼ばれない");
            pOrder.push("NG");
        },
    });

    cmd.createListener("complete", function (evt) {
        ok(false, "complete イベントのリスナを登録していた場合, 通信失敗時にはそれは呼ばれない");
        pOrder.push("NG");
    });
    cmd.createListener("error", function (evt) {
        ok(true, "error イベントのリスナを登録していた場合, 通信失敗時にはそれが呼ばれる");
        pOrder.push(1);
    });

    var callbackErrors = [];
    cmd._MyXMLHttpRequest = createXHRMock({
        errors: callbackErrors,
        responseGenerator: function (uri) {
            return {
                status: 500,
                responseText: "Server Error",
            };
        },
    });
    cmd.execute();

    setTimeout(function () {
        // editer=fxaddon がクエリパラメータとして追加される
        equal(lastOpendURI, "http://b.hatena.ne.jp/foo/add.edit.json" + "?editer=fxaddon");
        equal(callbackErrors.length, 0);

        deepEqual(pOrder, [1]);

        QUnit.start();
    }, 400); // 40 ms のタイムアウトで 3 回リトライするので長めに待つ必要がある
});

}).call(this);
