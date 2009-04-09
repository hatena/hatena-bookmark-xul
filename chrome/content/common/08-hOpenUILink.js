
const EXPORT = ['hOpenUILink'];

var hOpenUILink = function(link, ev) {
    if (Prefs.link.get('openInNewTab')) {
        ev = { ctrlKey: !ev.ctrlKey, __proto__: ev };
    }
    return openUILink(link, ev);
}
