const EXPORT = ["URLSuggestion"];

function URLSuggestion(originalURL, doc) {
    this.originalURL = originalURL;
    this.type = "";
    this.url = "";
    for (let [type, suggestor] in Iterator(suggestors)) {
        let suggestedURL = suggestor(originalURL, doc);
        if (suggestedURL) {
            this.type = type;
            this.url = suggestedURL;
            break;
        }
    }
}

var suggestors = {
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
    },

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
    }
};

function isSameEffectiveDomain(url1, url2) {
    const TLDService = getService("@mozilla.org/network/effective-tld-service;1", Ci.nsIEffectiveTLDService);
    return TLDService.getBaseDomain(newURI(url1)) ===
           TLDService.getBaseDomain(newURI(url2));
}
