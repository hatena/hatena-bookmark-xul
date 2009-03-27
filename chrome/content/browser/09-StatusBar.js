
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
elementGetter(this, 'statusComment', 'hBookmark-status-comment', document);

let countCache = new ExpireCache('uCount', 60 * 60); // 一時間キャッシュ

var StatusBar = {
    goHome: function StatusBar_goHome() {
        // browser.loadURIWithFlags(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        // XXX: 別タブで開きたい
        aWin.open(newURI('chrome://hatenabookmark/content/index.html'));
    },
    goEntry: function StatusBar_goEntry(event) {
        if (isHttp) {
            let url = locationURL;

            //openUILink(newURI('http://b.hatena.ne.jp/entry/' + url.replace('#', '%23')));
            openUILink('http://b.hatena.ne.jp/entry/' + url.replace('#', '%23'), event);
        }
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
        if (StatusBar.prefs.get('addButton'))
            StatusBar.checkBookmarked();
        if (StatusBar.prefs.get('counter'))
            StatusBar.checkCount();
    },
    get prefs() {
        if (!StatusBar._prefs) {
            StatusBar._prefs = new Prefs('extensions.hatenabookmark.statusbar.');
        }
        return StatusBar._prefs;
    },
    lastCountValue: null,
    appendCountImage: function StatusBar_appendCountImage(url) {
        let image = document.createElement('image');
        image.setAttribute('width', '7px');
        image.setAttribute('height', '9px');
        image.width = '7px';
        image.height = '9px';
        image.setAttribute('src', url);
        statusCount.appendChild(image);
    },
    checkCount: function StatusBar_checkCount() {
        statusCount.value = (isHttp ? HTTPCache.counter.get(locationURL) : '0') || '0';
        if (StatusBar.lastCountValue == statusCount.value) return;
        StatusBar.lastCountValue = statusCount.value;
        while (statusCount.firstChild) statusCount.removeChild(statusCount.firstChild);
        if (statusCount.value > 0) {
            let counts = statusCount.value.toString().split('');
            counts.forEach(function(i) {
                StatusBar.appendCountImage('chrome://hatenabookmark/skin/images/counter_' + i + '.png');
            });
        } else {
             StatusBar.appendCountImage('chrome://hatenabookmark/skin/images/counter_disable.png');
        }

        if (statusCount.value >= 5) {
            statusCount.setAttribute('users', 'many');
            statusComment.setAttribute('comment', 'true');
        } else if (statusCount.value >= 1) {
            statusComment.setAttribute('comment', 'true');
            statusCount.setAttribute('users', 'few');
        } else {
            statusComment.setAttribute('comment', 'false');
            statusCount.setAttribute('users', 'none');
        }
    },
    registerPrefsListeners: function () {
        StatusBar.prefs.createListener('addButton', StatusBar.prefsAddButtonHandler);
        StatusBar.prefs.createListener('counter', StatusBar.prefsCounterHandler);
        StatusBar.prefsAddButtonHandler();
        StatusBar.prefsCounterHandler();
    },
    prefsAddButtonHandler: function(e) {
        if (StatusBar.prefs.get('addButton')) {
            addButton.removeAttribute('hidden');
        } else {
            addButton.setAttribute('hidden', true);
        }
    },
    prefsCounterHandler: function(e) {
        if (StatusBar.prefs.get('counter')) {
            statusCount.removeAttribute('hidden');
            statusComment.removeAttribute('hidden');
        } else {
            statusCount.setAttribute('hidden', true);
            statusComment.setAttribute('hidden', true);
        }
    },
    loadHandler: function() {
        StatusBar.registerPrefsListeners();
        StatusBar.update();
        getBrowser().addEventListener('DOMContentLoaded', StatusBar.update, false);
    }
}

window.addEventListener('load', StatusBar.loadHandler, false);

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

/*
Application.activeWindow.events.addListener('TabOpen', function() {
    //getBrowser().addProgressListener(ProgressListenr, Ci.nsIWebProgress.NOTIFY_ALL);
    getBrowser().addEventListener('DOMContentLoaded', StatusBar.update, false);
});
*/

EventService.createListener('UserChange', function() {
    StatusBar.update();
}, User);

