
const EXPORT = ['StatusBar'];

// local utility 
this.__defineGetter__('aWin', function() Application.activeWindow);
this.__defineGetter__('aDoc', function() Application.activeWindow.activeTab.document);
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);
let _addButton;
this.__defineGetter__('addButton', function() {
    if (!_addButton)
        _addButton = document.getElementById('hBookmark-status-add');
    return _addButton;
});

var StatusBar = {
    goHome: function StatusBar_goHome() {
        // browser.loadURIWithFlags(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        // XXX: 別タブで開きたい
        aWin.open(newURI('chrome://hatenabookmark/content/index.html'));
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
        if (isHttp && User.user && User.user.hasBookmark(aDoc.location.href)) {
            addButton.setAttribute('added', true);
        } else {
            addButton.setAttribute('added', false);
        }
    }
}

Application.activeWindow.events.addListener('TabSelect', function() {
    StatusBar.checkBookmarked();
});

Application.activeWindow.events.addListener('TabOpen', function() {
    // XXX: このタイミングが微妙
    getBrowser().addEventListener('DOMContentLoaded', function() {
        StatusBar.checkBookmarked();
    }, false);
});

EventService.createListener('UserChange', function() {
    StatusBar.checkBookmarked();
}, User);

