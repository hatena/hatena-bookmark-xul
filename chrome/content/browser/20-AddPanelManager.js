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

    getBookmarkForBrowser: function APM_getBookmarkForBrowser(browser) {
        let win = browser.contentWindow;
        let url = win.location.href;
        let bookmark = Bookmark.findByUrl(url)[0];
        if (!bookmark) {
            bookmark = extend(new Bookmark(), {
                title:   (win.document && win.document.title) || url,
                url:     url,
                comment: "",
            });
        }
        return bookmark;
    },

    toggle: function APM_toggle() {
        let panel = this.currentPanel;
        let bookmark = this.getBookmarkForBrowser(gBrowser.selectedBrowser);
        if (panel.isOpen && panel.bookmark.url === bookmark.url)
            panel.hide();
        else
            panel.show(bookmark);
    }
};

window.addEventListener("load", AddPanelManager.init, false);
