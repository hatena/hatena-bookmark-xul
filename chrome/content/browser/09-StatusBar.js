
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
let _statusCount;
this.__defineGetter__('statusCount', function() {
    if (!_statusCount)
        _statusCount = document.getElementById('hBookmark-status-count');
    return _statusCount;
});

let countCache = new ExpireCache('uCount', 60 * 60); // 一時間キャッシュ
let commentCache = new ExpireCache('uComment', 60 * 60); // 一時間キャッシュ

var StatusBar = {
    goHome: function StatusBar_goHome() {
        // browser.loadURIWithFlags(url, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
        // XXX: 別タブで開きたい
        aWin.open(newURI('chrome://hatenabookmark/content/index.html'));
    },
    goEntry: function StatusBar_goEntry() {
        if (isHttp) {
            let url = aDoc.location.href;

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
    showComment: function StatusBar_showComment() {
        let reqURL = 'http://b.hatena.ne.jp/entry/json/?url=' + encodeURIComponent(url);
        let xhr = new XMLHttpRequest();
        let self = this;
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                let json = eval('(' + xhr.responseText + ')');
                let bookmarks = json.bookmarks;
                for (let i = 0;  i < bookmarks.length; i++) {
                    let b = bookmarks[i];
                    self.addUser(b);
                }
            }
        };
        xhr.open('GET', reqURL, true); // XXX
        xhr.send(null);
    },
    checkBookmarked: function StatusBar_checkBookmarked() {
        if (isHttp && User.user && User.user.hasBookmark(aDoc.location.href)) {
            addButton.setAttribute('added', true);
        } else {
            addButton.setAttribute('added', false);
        }
    },
    update: function StatsuBar_update() {
        this.checkBookmarked();
        this.checkCount();
    },
    updateCount: function StatusBar_updateCount() {
        statusCount.value = countCache.get(aDoc.location.href) || '';
        if (statusCount.value >= 5) {
            statusCount.setAttribute('users', 'many');
        } else if (statusCount.value >= 1) {
            statusCount.setAttribute('users', 'few');
        } else {
            statusCount.setAttribute('users', 'none');
        }
    },
    checkCount: function StatusBar_checkCount() {
        if (!isHttp) return this.updateCount();

        let url = aDoc.location.href;
        if (countCache.has(url)) 
            return this.updateCount();

        let reqURL = 'http://b.hatena.ne.jp/entry.count?url=' + encodeURIComponent(url);
        let xhr = new XMLHttpRequest();
        let self = this;
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                countCache.set(url, xhr.responseText||0);
                self.updateCount();
            }
        };
        xhr.open('GET', reqURL, true);
        xhr.send(null);

    },
}

Application.activeWindow.events.addListener('TabSelect', function() {
    StatusBar.update();
});

Application.activeWindow.events.addListener('TabOpen', function() {
    // XXX: このタイミングが微妙
    getBrowser().addEventListener('DOMContentLoaded', function() {
        StatusBar.update();
    }, false);
});

EventService.createListener('UserChange', function() {
    StatusBar.checkBookmarked();
}, User);

