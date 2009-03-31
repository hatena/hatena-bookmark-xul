const EXPORT = ["TitleGuesser"];

function TitleGuesser(url, callback) {
    this.callback = callback;
    this.xhr = new XMLHttpRequest();
    this.xhr.open("GET", url);
    this.xhr.overrideMimeType("text/plain; charset=x-user-defined");
    this.xhr.addEventListener("load", this, false);
    this.xhr.addEventListener("error", this, false);
    this.xhr.send(null);
}

extend(TitleGuesser.prototype, {
    handleEvent: function TG_handleEvent(event) {
        this.callback((event.type === "load") ? this.getTitle() : null);
    },
    getTitle: function TG_getTitle() {
        let contentType = this.xhr.getResponseHeader("Content-Type");
        // タイトルは先頭付近にあると推測されるので先頭 2KB だけ調べる
        let html = this.xhr.responseText.substring(0, 2048);
        html = html.replace(/[\u0100-\uffff]/g, function (c) {
            return String.fromCharCode(c.charCodeAt(0) & 0xff);
        });
        let encoding = this.getEncoding(contentType) || this.getEncoding(html);
        if (encoding) {
            try {
                let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                                getService(Ci.nsIScriptableUnicodeConverter);
                converter.charset = encoding;
                html = converter.ConvertToUnicode(html);
            } catch (ex) {}
        }
        let match = html.match(/<title>(.+?)<\/title>/i);
        return match && match[1];
    },
    getEncoding: function TG_getEncoding(source) {
        let match = /\bcharset\s*=\s*([\w.-]+)/i.exec(source || "");
        return match && match[1];
    }
});
