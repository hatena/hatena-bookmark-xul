const EXPORT = ["AddPanelManager"];

var AddPanelManager = {
    init: function APM_init() {
        gBrowser.browsers.forEach(AddPanelManager.setupPanel);
        gBrowser.addEventListener("TabOpen", AddPanelManager.onTabOpen, false);
    },

    onTabOpen: function APM_onTabOpen(event) {
        AddPanelManager.setupPanel(event.originalTarget.linkedBrowser);
    },

    setupPanel: function APM_setupPanel(browser) {
        let panel = document.createElementNS(XUL_NS, "vbox");
        panel.setAttribute("class", "hBookmarkAddPanel");
        panel.setAttribute("collapsed", "true");
        browser.parentNode.appendChild(panel);
    },

    getPanelForBrowser: function APM_getPanelForBrowser(browser) {
        let panel = browser.nextSibling;
        while (panel && !/\bhBookmarkAddPanel\b/.test(panel.className))
            panel = panel.nextSibling;
        return panel;
    },

    getBookmarkForBrowser: function APM_getBookmarkForBrowser(browser) {
        let win = browser.contentWindow;
        let url = win.location.href;
        return Model.Bookmark.findByUrl(url)[0] || {
            title:   (win.document && win.document.title) || url,
            url:     url,
            comment: ""
        };
    },

    toggle: function APM_toggle() {
        let browser = gBrowser.selectedBrowser;
        let panel = this.getPanelForBrowser(browser);
        let bookmark = this.getBookmarkForBrowser(browser);
        if (panel.isOpen && panel.bookmark.url === bookmark.url)
            panel.hide();
        else
            panel.show(bookmark);
    }
};

window.addEventListener("load", AddPanelManager.init, false);
