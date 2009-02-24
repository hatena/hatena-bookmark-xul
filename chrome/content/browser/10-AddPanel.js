// XXX ToDo: utils.jsmへ移動。名前空間URIの再考。
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

window.addEventListener("load", function () {
    gBrowser.browsers.forEach(setupAddPanel);
    gBrowser.addEventListener("TabOpen", function (event) {
        setupAddPanel(event.originalTarget.linkedBrowser);
    }, false);
}, false);

function setupAddPanel(browser) {
    let addPanel = document.createElementNS(XUL_NS, "hbookmark-addpanel");
    browser.parentNode.appendChild(addPanel);
}
