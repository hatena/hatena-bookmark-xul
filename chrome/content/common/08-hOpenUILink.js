
const EXPORT = ['hOpenUILink'];

var hOpenUILink = function(link, ev) {
    if (Prefs.link.get('openInNewTab')) {
        ev = { ctrlKey: !ev.ctrlKey, __proto__: ev };
    }
    return openUILink(link, ev);
}

hOpenUILink.updateDefault = function() {
    let win = getTopWin();
    if (win) {
        let doc = win.document;
        let openEL = doc.getElementById("hBookmarkEntryContext_open");
        let openIn = doc.getElementById("hBookmarkEntryContext_openInNewTab");
        if (openEL && openIn) {
            if (Prefs.link.get('openInNewTab')) {
                openIn.setAttribute('default', true);
                openEL.removeAttribute('default');
            } else {
                openEL.setAttribute('default', true);
                openIn.removeAttribute('default');
            }
        }
    }
}

hOpenUILink.changeHandler = function(ev) {
    hOpenUILink.updateDefault();
};

Prefs.link.createListener('openInNewTab', hOpenUILink.changeHandler);
EventService.createListener('load', hOpenUILink.changeHandler);


