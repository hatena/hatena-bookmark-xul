
const EXPORT = ['hOpenUILink'];

var hOpenUILink = function(link, ev) {
    let where = whereToOpenLink(ev);
    if (where === 'current' && Prefs.link.get('openInNewTab'))
        where = 'tab';
    if ((where === "tab" || where === "tabshifted") &&
        Prefs.bookmark.get("link.supportTreeStyleTab") &&
        typeof TreeStyleTabService !== "undefined")
        TreeStyleTabService.readyToOpenChildTab(getTopWin().gBrowser.currentTab, false);
    return openUILinkIn(link, where);
}
