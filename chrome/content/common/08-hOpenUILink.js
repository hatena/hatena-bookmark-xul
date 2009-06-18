
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
    return openUILink(link, event);
}
