
//window.addEventListener("load", function () {
//    gBrowser.browsers.forEach(setupAddPanel);
//    gBrowser.addEventListener("TabOpen", function (event) {
//        setupAddPanel(event.originalTarget.linkedBrowser);
//    }, false);
//    document.getElementById("hBookmark-addToBookmarkButton")
//            .addEventListener("click", toggleCurrentPanel, false);
//
//}, false);

function setupAddPanel(browser) {
    let addPanel = document.createElementNS(XUL_NS, "hbookmark-addpanel");
    browser.parentNode.appendChild(addPanel);
    addPanel.view = new AddPanelView();
    addPanel.targetBrowser = browser;
}

function toggleCurrentPanel() {
    let panel = gBrowser.selectedBrowser;
    while (panel && panel.localName !== "hbookmark-addpanel")
        panel = panel.nextSibling;
    if (!panel) throw new Error("Add-to-bookmark panel not found");
    panel.toggle();
}
