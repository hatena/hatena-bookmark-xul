
const EXPORT = ['StatusBar'];

// local utility 
this.__defineGetter__('aWin', function() Application.activeWindow);
this.__defineGetter__('aDoc', function() {
    // chrome スキームなどで、 fuel がエラー
    try {
        return aWin.activeTab.document;
    } catch(e) { return null; }
});
this.__defineGetter__('locationURL', function() {
    return aDoc ? aDoc.location.href : null;
});
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);


elementGetter(this, 'addButton', 'hBookmarkAddButton', document);
elementGetter(this, 'statusCount', 'hBookmark-status-count', document);


let countCache = new ExpireCache('uCount', 60 * 60); // 一時間キャッシュ

var StatusBar = {
    goHome: function StatusBar_goHome() {
        // browser.loadURIWithFlags(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        // XXX: 別タブで開きたい
        aWin.open(newURI('chrome://hatenabookmark/content/index.html'));
    },
    goEntry: function StatusBar_goEntry() {
        if (isHttp) {
            let url = locationURL;

            aWin.open(newURI('http://b.hatena.ne.jp/entry/' + url.replace('#', '%23')));
        }
    },
    addBookmark: function StatusBar_addBookmark() {
        let d = new Date;
        let contentDocument = window._content.document;
        let s = contentDocument.createElement('script');
        s.charset = 'UTF-8';
        s.src = 'http://b.hatena.ne.jp/js/Hatena/Bookmark/let.js?' + d.getFullYear() + d.getMonth() + d.getDate();
        let doc = aDoc;
        if (isHttp)
            (doc.getElementsByTagName('head')[0] || doc.body).appendChild(s);
    },
    checkBookmarked: function StatusBar_checkBookmarked() {
        if (isHttp && User.user && User.user.hasBookmark(locationURL)) {
            addButton.setAttribute('added', true);
        } else {
            addButton.setAttribute('added', false);
        }
    },
    lastURL: null,
    update: function StatsuBar_update() {
        let lURL = locationURL;
        if (StatusBar.lastURL == lURL) return;

        StatusBar.lastURL = lURL;
        StatusBar.checkBookmarked();
        StatusBar.checkCount();
    },
    checkCount: function StatusBar_checkCount() {
        statusCount.value = (isHttp ? HTTPCache.counter.get(locationURL) : '0') || '0';
        if (statusCount.value >= 5) {
            statusCount.setAttribute('users', 'many');
        } else if (statusCount.value >= 1) {
            statusCount.setAttribute('users', 'few');
        } else {
            statusCount.setAttribute('users', 'none');
        }
    },
}



Application.activeWindow.events.addListener('TabSelect', function() {
    StatusBar.update();
});

/*
let ProgressListenr = {
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIWebProgressListener,
        Ci.nsIXULBrowserWindow
    ]),
    onStateChange: function (webProgress, request, flags, status)
    {
         if (flags & (Ci.nsIWebProgressListener.STATE_IS_DOCUMENT | Ci.nsIWebProgressListener.STATE_IS_WINDOW)) {
             if (flags & Ci.nsIWebProgressListener.STATE_START) {
                StatusBar.update();
             }
         }
    },
    onSecurityChange: function (webProgress, aRequest, aState) {},
    onStatusChange: function (webProgress, request, status, message) {},
    onProgressChange: function (webProgress, request, curSelfProgress, maxSelfProgress, curTotalProgress, maxTotalProgress) {},
    onLocationChange: function () {},
}
*/


// XXX: うーん
// getBrowser().addProgressListener(ProgressListenr, Ci.nsIWebProgress.NOTIFY_ALL);

Application.activeWindow.events.addListener('TabOpen', function() {
    //getBrowser().addProgressListener(ProgressListenr, Ci.nsIWebProgress.NOTIFY_ALL);
    getBrowser().addEventListener('DOMContentLoaded', StatusBar.update, false);
});

EventService.createListener('UserChange', function() {
    StatusBar.update();
}, User);

