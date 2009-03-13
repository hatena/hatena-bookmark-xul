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
        panel.targetBrowser = browser;
    },

    toggle: function APM_toggle() {
        let panel = gBrowser.selectedBrowser.nextSibling;
        while (!/\bhBookmarkAddPanel\b/.test(panel.className))
            panel = panel.nextSibling;
        panel.toggle();
    }
};

window.addEventListener("load", AddPanelManager.init, false);
