const EXPORT = ["AddPanelManager"];

let Bookmark = Model.Bookmark;

var AddPanelManager = {
    init: function APM_init() {
        gBrowser.browsers.forEach(AddPanelManager.setupPanel);
        gBrowser.addEventListener("TabOpen", AddPanelManager.onTabOpen, false);
    },

    onTabOpen: function APM_onTabOpen(event) {
        AddPanelManager.setupPanel(event.originalTarget.linkedBrowser);
    },

    setupPanel: function APM_setupPanel(browser) {
        let splitter = document.createElementNS(XUL_NS, "splitter");
        splitter.setAttribute("collapsed", "true");
        splitter.setAttribute("style", "min-height: 0;");
        let panel = document.createElementNS(XUL_NS, "vbox");
        panel.setAttribute("class", "hBookmarkAddPanel");
        panel.setAttribute("collapsed", "true");
        browser.parentNode.appendChild(splitter);
        browser.parentNode.appendChild(panel);
        panel.splitter = splitter;
    },

    get currentPanel APM_get_currentPanel() {
        return this.getPanelForBrowser(gBrowser.selectedBrowser);
    },

    getPanelForBrowser: function APM_getPanelForBrowser(browser) {
        let panel = browser.nextSibling;
        while (panel && !/\bhBookmarkAddPanel\b/.test(panel.className))
            panel = panel.nextSibling;
        return panel;
    },

    // XXX AddPanelManagerではなく全体に属すべき。
    getBookmarkFor: function APM_getBookmarkFor(item) {
        if (item.url) return item;
        let win = item instanceof Ci.nsIDOMWindow ? item : null;
        let url = win ? win.location.href :
            (item instanceof Ci.nsIURI) ? item.spec : String(item);
        let bookmark = Bookmark.findByUrl(url)[0];
        if (bookmark) return bookmark;
        bookmark = new Bookmark();
        bookmark.title = win ? (win.document.title || url) : "";
        bookmark.url = url;
        bookmark.comment = "";
        return bookmark;
    },

    toggle: function APM_toggle() {
        let panel = this.currentPanel;
        let bookmark = this.getBookmarkFor(gBrowser.contentWindow);
        if (panel.isOpen && panel.bookmark.url === bookmark.url)
            panel.hide();
        else
            panel.show(bookmark);
    },

    showPanel: function APM_showPanel(item) {
        let bookmark = this.getBookmarkFor(item);
        this.currentPanel.show(bookmark);
    }
};

window.addEventListener("load", AddPanelManager.init, false);
