
const EXPORT = ['hOpenUILink'];

let key = (getService('@mozilla.org/xre/app-info;1', Ci.nsIXULRuntime).OS === 'Darwin')
    ? 'metaKey' : 'ctrlKey';

var hOpenUILink = function(link, ev) {
    let event = ev;
    if (Prefs.link.get('openInNewTab') && ev) {
        event = {};
        event[key] = !ev[key];
        event.__proto__ = ev;
    }
    let where = whereToOpenLink(event);
    if ((where === "tab" || where === "tabshifted") &&
        Prefs.bookmark.get("link.supportTreeStyleTab") &&
        typeof TreeStyleTabService !== "undefined")
        TreeStyleTabService.readyToOpenChildTab(getTopWin().gBrowser.currentTab, false);
    return openUILinkIn(link, where);
}
