
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

let strings = new Strings('chrome://hatenabookmark/locale/browser.properties');

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
    lastCountValue: NaN,
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
        if (val !== null) val = +val || 0;
        if (StatusBar.lastCountValue == val) return;
        StatusBar.lastCountValue = val;
        let label = (val == null) ? strings.get('counter.ignoredLabel') : val;
        statusCountLabel.setAttribute('value', label);
        UIUtils.deleteContents(statusCount);
        statusCount.appendChild(statusCountLabel);
        if (val > 0) {
            let counts = val.toString().split('');
            counts.forEach(function(i) {
                StatusBar.appendCountImage('chrome://hatenabookmark/skin/images/counter_' + i + '.png');
            });
        } else if (val == 0) {
            StatusBar.appendCountImage('chrome://hatenabookmark/skin/images/counter_disable.png');
        } else {
            StatusBar.appendCountImage('chrome://hatenabookmark/skin/images/counter_ignored.png');
        }

        if (val >= 5) {
            statusCount.setAttribute('users', 'many');
            statusComment.setAttribute('comment', 'true');
        } else if (val >= 1) {
            statusComment.setAttribute('comment', 'true');
            statusCount.setAttribute('users', 'few');
        } else {
            statusComment.setAttribute('comment', 'false');
            statusCount.setAttribute('users', 'none');
        }
    },
    registerPrefsListeners: function () {
        p('register prefs listeners');
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
        gBrowser.addProgressListener(StatusBar.progressListener);
        gBrowser.addEventListener('unload', StatusBar.unloadHandler, false);
        statusComment.addEventListener('mouseover', StatusBar.commentViewerOverHandler, false);
    },
    unloadHandler: function(ev) {
        gBrowser.removeProgressListener(StatusBar.progressListener);
    },
    commentViewerOverHandler: function(ev) {
        CommentViewer.autoHoverShow();
    },
    updateHandler: function(ev) {
        StatusBar.update;
    },
    progressListener: {
        onLocationChange: function (progress, request, location) {
            StatusBar.update();
        },
        onStateChange: function (progress, request, flags, status) {},
        onProgressChange: function (progress, request, curSelf, maxSelf,
                                    curTotal, maxTotal) {},
        onProgressChange64: function (progress, request, curSelf, maxSelf,
                                      curTotal, maxTotal) {},
        onStatusChange: function (progress, request, status, message) {},
        onSecurityChange: function (progress, request, state) {},
        onRefreshAttempted: function (progress, refreshURI, millis, sameURI) true,
        QueryInterface: XPCOMUtils.generateQI([
            Ci.nsIWebProgressListener,
            Ci.nsIWebProgressListener2,
            Ci.nsISupportsWeakReference,
        ])
    }
}

window.addEventListener('load', StatusBar.loadHandler, false);

document.addEventListener('TabSelect', function() {
    StatusBar.update();
}, false);

EventService.createListener('UserChange', function() {
    StatusBar.update();
});

EventService.createListener('BookmarksUpdated', function() {
    if (StatusBar.prefs.get('addButton'))
        StatusBar.checkBookmarked();
});
