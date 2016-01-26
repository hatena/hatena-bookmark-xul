var EXPORT = ["URLSuggestion"];

function URLSuggestion(originalURL, doc) {
    this.originalURL = originalURL;
    this.type = "";
    this.url = "";
    this.wantsFallback = !doc;
    for (let [type, suggestor] in Iterator(URLSuggestion.suggestors)) {
        let suggestedURL = suggestor(originalURL, doc);
        if (suggestedURL) {
            this.type = type;
            this.url = suggestedURL;
            this.wantsFallback = false;
            break;
        }
    }
}

extend(URLSuggestion.prototype, {
    suggest: function US_suggest(callback, thisObject) {
        if (this.url) {
            callback.call(thisObject, this);
        } else if (this.wantsFallback) {
            let originalURL = this.originalURL;
            let self = this;
            net.get(originalURL, function gotContent(res) {
                for (let [type, suggestor] in Iterator(URLSuggestion.responseSuggestors)) {
                    let suggestedURL = suggestor(originalURL, res);
                    if (suggestedURL) {
                        self.type = type;
                        self.url = suggestedURL;
                        callback.call(thisObject, self);
                        break;
                    }
                }
            }, null, true);
        }
    }
});

extend(URLSuggestion, {
    suggestors: {
        meta: function US_suggestor_meta(originalURL, doc) {
            const B_ENTRY = B_HTTP + "entry/";
            if (!Prefs.bookmark.get("addPanel.notifyMetaBookmark") ||
                originalURL.substring(0, B_ENTRY.length) !== B_ENTRY)
                return null;
            let url = originalURL.substring(B_ENTRY.length).replace(/%23/g, "#");
            if (doc) {
                let link = doc.getElementById("head-entry-link");
                if (link && link.href)
                    url = link.href;
            }
            return /^https?:\/\//.test(url) ? url : null;
        },

        canonical: function US_suggestor_canonical(originalURL, doc) {
            if (!Prefs.bookmark.get("addPanel.notifyCanonicalURL") ||
                !(doc instanceof HTMLDocument))
                return null;
            let link = doc.evaluate(
                '/h:html/h:head/h:link[translate(@rel, "CANONICAL", "canonical") = "canonical"]',
                doc,
                function () doc.documentElement.namespaceURI || "",
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
            if (!link || !link.href) return null;
            let url = link.href;
            if (url.indexOf("#") === -1)
                url += doc.defaultView.location.hash;
            return (isSameEffectiveDomain(url, originalURL) && url !== originalURL)
                ? url : null;
        }
    },

    responseSuggestors: {
        canonical: function US_resSugestor_canonical(originalURL, res) {
            if (!Prefs.bookmark.get("addPanel.notifyCanonicalURL")) return null;
            let match = res.responseText.match(/<link\s[^>]*\brel\s*=\s*(?:"canonical"|'canonical'|canonical\b)[^>]*>/i);
            if (!match) return null;
            match = match[0].match(/\bhref\s*=\s*(?:"(.*?)"|'(.*?)'|(\S+))/i);
            let href = match && decodeReferences(match[1] || match[2] || match[3] || "");
            if (!href) return null;
            let url = newURI(href, null, originalURL).spec;
            let fragmentIndex = originalURL.indexOf("#");
            if (fragmentIndex !== -1 && url.indexOf("#") === -1)
                url += originalURL.substring(fragmentIndex);
            return (isSameEffectiveDomain(url, originalURL) && url !== originalURL)
                ? url : null;
        }
    }
});

function isSameEffectiveDomain(url1, url2) {
    const TLDService = getService("@mozilla.org/network/effective-tld-service;1", Ci.nsIEffectiveTLDService);
    return TLDService.getBaseDomain(newURI(url1)) ===
           TLDService.getBaseDomain(newURI(url2));
}
