var EXPORT = ["SearchEmbedder"];

function SearchEmbedder(doc) {
    this.site = SiteInfoSet.Search.get(doc);
    this.state = SearchEmbedder.STATE_INITIALIZED;
    if (this.site && !this.site.data.disable &&
        this.isValidDomain() && !this.searchElement)
        this.ready();
}

(function () {

var utils = {};
Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm", utils);

SearchEmbedder.STATE_INITIALIZED = 0x00;
SearchEmbedder.STATE_LOAD_DONE   = 0x01;
SearchEmbedder.STATE_SEARCH_DONE = 0x02;
SearchEmbedder.STATE_EMBED_READY = SearchEmbedder.STATE_LOAD_DONE |
                                   SearchEmbedder.STATE_SEARCH_DONE;
SearchEmbedder.STATE_COMPLETE    = -1;

extend(SearchEmbedder.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/embed.properties"),

    get doc() this.site.doc,
    get win() this.site.win,
    get url() this.site.url,

    isValidDomain: function SE_isValidDomain() {
        const TLDService = getService("@mozilla.org/network/effective-tld-service;1", Ci.nsIEffectiveTLDService);
        let domainPattern = this.site.data.baseDomain;
        if (!domainPattern) return false;
        if (typeof domainPattern === "string")
            domainPattern = new RegExp(domainPattern);
        let domain = TLDService.getBaseDomainFromHost(this.win.location.hostname);
        return domainPattern.test(domain);
    },

    ready: function SE_ready() {
        let url = this.url;
        let query = this.site.queryFirstString("query", url);
        if (!query) return;
        let encoding = this.site.queryFirstString("encoding", url) || "utf-8";
        let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                        createInstance(Ci.nsIScriptableUnicodeConverter);
        query = unescape(query.replace(/\+/g, " "));
        try {
            converter.charset = encoding;
            query = converter.ConvertToUnicode(query);
        } catch (ex) {}
        this.query = query;
        this.doc.addEventListener("DOMContentLoaded", this, false);
        //this.win.addEventListener("pageshow", this, false);
        //this.win.addEventListener("load", this, false);
        FullTextSearch.search(query, method(this, 'onSearch'));
        // XXX Since net.get() can't handle timeout,
        // manually force an error display.
        this.win.setTimeout(function (self) {
            if (self.state === SearchEmbedder.STATE_COMPLETE) return;
            p('SearchEmbedder: maybe timeout');
            self.embedFailure();
            //self.state = SearchEmbedder.STATE_COMPLETE;
        }, 15000, this);
    },

    embed: function SE_embed() {
        if (this.state === SearchEmbedder.STATE_COMPLETE) return;
        if (this.state !== SearchEmbedder.STATE_EMBED_READY) {
            this.embedStandby();
            return;
        }
        let data = this.data;
        if (data && data.meta && data.meta.status === 200 && data.meta.total) {
            this.embedContent(this.createSearchResult());
        } else {
            this.embedFailure();
        }
        this.state = SearchEmbedder.STATE_COMPLETE;
    },

    embedStandby: function SE_embedStandby() {
        if (!Prefs.bookmark.get("embed.showSearchStandby")) return;
        let elem = this.doc.createElementNS(XHTML_NS, "div");
        elem.classList.add("hBookmark-search-standby");
        elem.textContent = this.strings.get("search.standbyLabel");
        this.embedContent(elem);
    },

    embedFailure: function SE_embedFailure() {
        if (!Prefs.bookmark.get("embed.showSearchStandby")) return;
        let elem = this.doc.createElementNS(XHTML_NS, "div");
        elem.classList.add("hBookmark-search-failure");
        elem.textContent = (this.data && this.data.meta && !this.data.meta.total)
                         ? this.strings.get("search.noMatchError")
                         : this.strings.get("search.unexpectedError");
        this.embedContent(elem);
    },

    embedContent: function SE_embedContent(content) {
        let search = this.searchElement;
        if (!search) {
            let point = this.insertionPoint;
            if (!point) return;
            this.embedStyle();
            search = this.createSearchContainer();
            point.insertNode(search);
        }
        let container = search.getElementsByClassName("hBookmark-search-container")[0];
        if (!container) return;
        content = (typeof content === "string")
                ? this.doc.createTextNode(content)
                : content;
        UIUtils.deleteContents(container);
        container.appendChild(content);
    },

    embedStyle: function SE_embedStyle() {
        let head = this.doc.getElementsByTagName("head")[0];
        if (!head) return;
        let style = this.doc.createElement("style");
        style.textContent = SearchEmbedder.STYLE + (this.site.data.style || "");
        head.appendChild(style);
    },

    get insertionPoint() {
        if (this._insertionPoint) return this._insertionPoint.cloneRange();
        let annotation = this.site.query("annotation", this.doc);
        if (!annotation) return null;
        let range = this.doc.createRange();
        switch (this.site.data.annotationPosition || "last") {
        case "before":
            range.selectNode(annotation);
            range.collapse(true);
            break;
        case "after":
            range.selectNode(annotation);
            range.collapse(false);
            break;
        case "first":
            range.selectNodeContents(annotation);
            range.collapse(true);
            break;
        case "last":
        default:
            range.selectNodeContents(annotation);
            range.collapse(false);
            break;
        }
        this._insertionPoint = range;
        return range.cloneRange();
    },

    get searchElement() {
        return this.doc.getElementById("hBookmark-search");
    },

    createSearchContainer: function SE_createSearchContainer() {
        let elemStr =
            '<div id="hBookmark-search">' +
              '<div class="hBookmark-search-heading">' +
                '<span class="hBookmark-search-title"></span>' +
              '</div>' +
              '<div class="hBookmark-search-container"></div>' +
            '</div>';
        let elem = this.doc.createRange().createContextualFragment(elemStr).firstChild;
        elem.getElementsByTagName("span").item(0).textContent = this.strings.get("search.title");
        return elem;
    },

    createSearchResult: function SE_createSearchResult() {
        let data = this.data;
        let query = this.query;
        let doc = this.doc;
        let range = this.doc.createRange();

        let resDocFragment = doc.createDocumentFragment();

        let searchInfoElemStr =
            '<div class="hBookmark-search-info">' +
              '<a class="hBookmark-search-user">' +
                '<img alt="" width="16" height="16"/>' +
                '<span class="hBookmark-search-user-name"></span>' +
              '</a>' +
              '<span class="hBookmark-search-status"></span>' +
            '</div>';
        let searchInfoElem = range.createContextualFragment(searchInfoElemStr).firstChild;
        resDocFragment.appendChild(searchInfoElem);
        let userElem = searchInfoElem.getElementsByClassName("hBookmark-search-user").item(0);
        userElem.href = User.user.bookmarkHomepage;
        userElem.getElementsByClassName("hBookmark-search-user-name").item(0).textContent =
            User.user.name;
        userElem.getElementsByTagName("img").item(0).src =
            User.user.getProfileIcon();

        let statusElem = searchInfoElem.getElementsByClassName("hBookmark-search-status").item(0);
        let statusPattern = this.strings.get("search.statusPattern");
        (function appendFilledInContent(statusElem, statusPattern, params) {
            statusPattern.split(/\{(.*?)\}/).forEach(function (key, i) {
                if (i === 0) return;
                var node;
                if (i % 2 === 1) {
                    node = doc.createElementNS(XHTML_NS, "b");
                    let param = (typeof params[key] === "object" ? params[key] : {});
                    node.textContent = (typeof param.text !== "undefined" ? param.text : "-");
                    if (param.classList) {
                        param.classList.forEach(function (className) {
                            node.classList.add(className);
                        });
                    }
                } else {
                    node = doc.createTextNode(key);
                }
                statusElem.appendChild(node);
            });
        }).call(this, statusElem, statusPattern, {
            // query は今のところ表示されなさそう
            query:   { text: query, classList: ["hBookmark-search-query"] },
            count:   { text: data.bookmarks.length },
            total:   { text: data.meta.total },
            elapsed: { text: data.meta.elapsed.toFixed(2) }
        });

        let queryRE = this._createKeywordPattern(data.meta.query.queries);
        let dlStr = '<dl class="hBookmark-search-results"></dl>';
        let dl = range.createContextualFragment(dlStr).firstChild;
        resDocFragment.appendChild(dl);
        data.bookmarks.forEach(function (bookmark) {
            let entry = bookmark.entry;

            let titleStr =
                '<dt><a href="#"><img src="#" width="16" height="16"/></a></dt>';
            let titleElem = range.createContextualFragment(titleStr).firstChild;
            titleAnchorElem = titleElem.getElementsByTagName("a").item(0);
            titleAnchorElem.href = entry.url;
            let faviconUriStr = 'http://cdn-ak.favicon.st-hatena.com/?url=' + encodeURIComponent(entry.url);
            titleAnchorElem.firstElementChild.src = faviconUriStr;
            this._appendEmphasizedContent(titleAnchorElem, entry.title, queryRE);
            dl.appendChild(titleElem);

            if (entry.snippet) {
                let snippetElem = doc.createElement("dd");
                snippetElem.classList.add("hBookmark-search-snippet");
                this._appendEmphasizedContent(snippetElem, entry.snippet, queryRE);
                dl.appendChild(snippetElem);
            }

            if (bookmark.comment) {
                let commentElem = doc.createElement("dd");
                commentElem.classList.add("hBookmark-search-comment");
                this._appendCommentContents(commentElem, bookmark.comment, queryRE);
                dl.appendChild(commentElem);
            }

            let infoStr =
                '<dd class="hBookmark-search-info">' +
                  '<span class="hBookmark-search-url"></span>' +
                  '<a class="hBookmark-search-counter" href="#"></a>' +
                '</dd>';
            let infoElem = range.createContextualFragment(infoStr).firstChild;
            let displayURL = UIUtils.cropURL(entry.url);
            this._appendEmphasizedContent(infoElem.firstElementChild, displayURL, queryRE);
            let infoAnchorElem = infoElem.getElementsByTagName("a").item(0);
            infoAnchorElem.href = entryURL(entry.url);
            infoAnchorElem.textContent = UIUtils.getUsersText(entry.count);
            if (entry.count >= 3) {
                infoAnchorElem.classList.add(
                    (entry.count >= 10) ? "hBookmark-search-too-many"
                                        : "hBookmark-search-many"
                );
            }
            infoElem.insertBefore(doc.createTextNode(" "), infoAnchorElem);
            dl.appendChild(infoElem);
        }, this);

        if (data.meta.total > data.bookmarks.length) {
            let smStr =
                '<div class="hBookmark-search-more"><a href="#"></a></div>';
            let smElem = range.createContextualFragment(smStr).firstChild;
            let ancElem = smElem.firstElementChild;
            ancElem.href = B_HTTP + FullTextSearch.getPath(query);
            ancElem.textContent = this.strings.get("search.showAllLabel");
            resDocFragment.appendChild(smElem);
        }

        if (Prefs.bookmark.get("link.openInNewTab")) {
            let cns = resDocFragment.childNodes;
            for (let i = 0, lenI = cns.length; i < lenI; ++i) {
                let e = cns.item(i);
                let anchorElems = e.getElementsByTagName("a");
                for (let j = 0, lenJ = anchorElems.length; j < lenJ; ++j) {
                    anchorElems.item(j).setAttribute("target", "_blank");
                }
            }
        }

        return resDocFragment;
    },

    _appendEmphasizedContent: function SE__appendEmphasizedContent(element,
                                                                   text,
                                                                   keyword) {
        var doc = this.doc;
        if (keyword.constructor.name !== "RegExp")
            keyword = this._createKeywordPattern(keyword);
        text.split(keyword).forEach(function (fragment, i) {
            var node;
            if (i & 1) {
                node = doc.createElementNS(XHTML_NS, "em");
                node.textContent = fragment;
            } else {
                node = doc.createTextNode(fragment);
            }
            element.appendChild(node);
        });
        return element;
    },

    _createKeywordPattern: function SE__createKeywordPattern(keywords) {
        return new RegExp("(" + [].concat(keywords).map(function (k) {
            return k.replace(/\W/g, "\\$&");
        }).join("|") + ")", "i");
    },

    _appendCommentContents: function SE__appendCommentContents(element,
                                                               comment,
                                                               keyword) {
        var doc = this.doc;
        let tags = comment.match(/\[[^\[\]]+\]/gy);
        if (tags) {
            let n = 0;
            tags.forEach(function (tag, i, tags) {
                n += tag.length;
                let tagElement = doc.createElementNS(XHTML_NS, "span");
                tagElement.classList.add("hBookmark-search-tag");
                this._appendEmphasizedContent(tagElement, tag.slice(1, -1), keyword);
                element.appendChild(tagElement);
                let tn = doc.createTextNode((i === tags.length - 1) ? " " : ", ");
                element.appendChild(tn);
            }, this);
            comment = comment.substring(n);
        }
        this._appendEmphasizedContent(element, comment, keyword);
        return element;
    },

    handleEvent: function SE_handleEvent(event) {
        switch (event.type) {
        case "DOMContentLoaded":
            this.state |= SearchEmbedder.STATE_LOAD_DONE;
            this.embed();
            break;

        case "pageshow":
        case "load":
            p(event.type + " " + this.state);
            break;
        }
    },

    onSearch: function SE_onSearch(data) {
        this.data = data;
        this.state |= SearchEmbedder.STATE_SEARCH_DONE;
        this.embed();
    },
});

// CSS を読み込み
SearchEmbedder.STYLE = utils.loadCssStrFromResource("search-embedder.css");

}).call(this);

(function () {
    var progressListener = Object.create(WebProgressListenerPrototype);
    progressListener.onLocationChange = function SEPL_onLocationChange(
                                            progress, request, location) {
        var isEmbedSearchDisabled = (
                !User.user || !User.user.canUseFullTextSearch ||
                !Prefs.bookmark.get("embed.search"));
        if (isEmbedSearchDisabled) return;
        new SearchEmbedder(progress.DOMWindow.document);
    };

    window.addEventListener("load", function SetupSearchEmbedder() {
        gBrowser.addProgressListener(progressListener);
    }, false);

    window.addEventListener("unload", function ShutdownSearchEmbedder() {
        gBrowser.removeProgressListener(progressListener);
    }, false);
}).call(this);
