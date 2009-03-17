let hBookmark;

function warmUp() {
    utils.include("btil.js");
    let g = loadAutoloader("chrome://hatenabookmark/content/browser.xul");
    hBookmark = g.hBookmark;
}

let lastOpendURI = null;

function myXHR() {}
myXHR.result = {
    readyState: 4,
    status: 200,
    responseText: "{}"
},
myXHR.prototype = {
    open: function (method, uri) lastOpendURI = uri,
    send: function () setTimeout(function (self) {
        hBookmark.extend(self, myXHR.result);
        self.onreadystatechange();
        dump(self.onreadystatechange);
    }, 1000, this),
    __noSuchMethod__: function () {}
};

function testExecute() {
    hBookmark.XMLHttpRequest = myXHR;

    let isComplete = false, isError = false;
    let cmd = new hBookmark.RemoteCommand("edit", {
        user: { name: "foo", rks: "bar" },
        onComplete: function () isComplete = true,
        onError: function () isError = true
    });
    cmd.execute();
    yield 1200;
    assert.equals(true, isComplete);
    assert.equals(false, isError);
    assert.equals("http://b.hatena.ne.jp/foo/add.edit.json", lastOpendURI);

    delete hBookmark.XMLHttpRequest;
}
