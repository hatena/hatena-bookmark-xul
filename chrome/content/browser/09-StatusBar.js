
const EXPORT = ['StatusBar'];

// local utility 
this.__defineGetter__('aWin', function() getTopWin());
this.__defineGetter__('aDoc', function() getTopWin().gBrowser.contentDocument);
this.__defineGetter__('locationURL', function() {
    return aDoc ? aDoc.location.href : null;
});
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);


elementGetter(this, 'addButton', 'hBookmarkAddButton', document);
elementGetter(this, 'statusCount', 'hBookmark-status-count', document);
elementGetter(this, 'statusCountLabel', 'hBookmark-status-count-label', document);
elementGetter(this, 'statusComment', 'hBookmark-status-comment', document);

var StatusBar = {
    goEntry: function StatusBar_goEntry(ev) {
        if (ev.button == 2) return; // 右クリック
        if (isHttp) {
            let url = locationURL;

            //hOpenUILink(newURI('http://b.hatena.ne.jp/entry/' + url.replace('#', '%23')));
            hOpenUILink(entryURL(url), ev);
        }
    },
    showPanelToggle: function StatusBar_showPanelToggle(ev) {
        if (ev.button == 2) return; // 右クリック
        AddPanelManager.toggle();
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
        let doc = document;
        if (!document) {
            let win = getTopWin();
            if (win) {
                doc = win.document;
            }
        }
        if (!doc) return;
        let image = doc.createElement('image');
        image.setAttribute('width', '7px');
        image.setAttribute('height', '9px');
        image.width = '7px';
        image.height = '9px';
        image.setAttribute('src', url);
        statusCount.appendChild(image);
    },
    checkCount: function StatusBar_checkCount() {
        if (isHttp) {
            HTTPCache.counter.async_get(locationURL, StatusBar.setCount);
        } else {
            StatusBar.setCount('0');
        }
    },
    setCount: function(val) {
        statusCount.value = val || '0';
        if (StatusBar.lastCountValue == statusCount.value) return;
        StatusBar.lastCountValue = statusCount.value;
        statusCountLabel.setAttribute('value', statusCount.value);
        while (statusCount.firstChild) statusCount.removeChild(statusCount.firstChild);
        statusCount.appendChild(statusCountLabel);
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
        p('register prefs listerners');
        StatusBar.prefsAddButtonHandler();
        StatusBar.prefsCounterHandler();
        StatusBar.prefs.createListener('addButton', StatusBar.prefsAddButtonHandler);
        StatusBar.prefs.createListener('counter', StatusBar.prefsCounterHandler);
    },
    prefsAddButtonHandler: function(e) {
        p('prefs add button check');
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
    loadHandler: function(ev) {
        p('statusbar load handler');
        StatusBar.registerPrefsListeners();
        StatusBar.update();
        gBrowser.addEventListener('DOMContentLoaded', StatusBar.update, false);
        statusComment.addEventListener('mouseover', StatusBar.commentViewerOverHandler, false);
    },
    commentViewerOverHandler: function(ev) {
        CommentViewer.autoHoverShow();
    },
    updateHandler: function(ev) {
        StatusBar.update;
    },
}

EventService.createListener('load', StatusBar.loadHandler);

document.addEventListener('TabSelect', function() {
    StatusBar.update();
}, false);

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
document.addEventListener('TabOpen', function() {
    //getBrowser().addProgressListener(ProgressListenr, Ci.nsIWebProgress.NOTIFY_ALL);
    getBrowser().addEventListener('DOMContentLoaded', StatusBar.update, false);
}, false);
*/

EventService.createListener('UserChange', function() {
    StatusBar.update();
}, User);

