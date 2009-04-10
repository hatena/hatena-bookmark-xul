
const EXPORT = ['CommentViewer'];

// local utility 
this.__defineGetter__('aWin', function() Application.activeWindow);
this.__defineGetter__('aDoc', function() Application.activeWindow.activeTab.document);
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);

let E = createElementBindDocument(document, XHTML_NS);

elementGetter(this, 'panelComment', 'hBookmark-panel-comment', document);
elementGetter(this, 'commentButton', 'hBookmark-status-comment', document);
elementGetter(this, 'commentContainer', 'hBookmark-comment-container', document);
elementGetter(this, 'listContainer', 'hBookmark-comment-list-container', document);
elementGetter(this, 'list', 'hBookmark-comment-list', document);
elementGetter(this, 'listDiv', 'hBookmark-comment-div', document);
elementGetter(this, 'statusbar', 'status-bar', document);

elementGetter(this, 'faviconImage', 'hBookmark-comment-favicon', document);
elementGetter(this, 'titleLabel', 'hBookmark-comment-title', document);
elementGetter(this, 'usersLabel', 'hBookmark-comment-users', document);
elementGetter(this, 'toggleImage', 'hBookmark-comment-toggle', document);


let userIcon = function(username) {
    return E('img', {
        src: 'https://www.hatena.ne.jp/users/' + username.substring(0, 2) + '/' + username + '/profile_s.gif',
        className: 'usericon',
        width: '16px',
        height: '16px',
        alt: username,
    });
}

var CommentViewer = {
    filterToggle: function() {
        CommentViewer.prefs.set('showAll', !CommentViewer.prefs.get('showAll'));
        CommentViewer.updateToggle();
        CommentViewer.updateViewer();
    },
    get prefs() {
        if (!CommentViewer._prefs) {
            CommentViewer._prefs = new Prefs('extensions.hatenabookmark.commentviewer.');
        }
        return CommentViewer._prefs;
    },
    updateToggle: function() {
        let src;
        if (CommentViewer.isFilter) {
             src = "chrome://hatenabookmark/skin/images/comment-viewer-toggle-off.png";
        } else {
             src = "chrome://hatenabookmark/skin/images/comment-viewer-toggle-on.png";
        }
        toggleImage.src = src;
    },
    get isFilter() {
        return !CommentViewer.prefs.get('showAll');
    },
    showClick: function CommentViewer_show() {
        if (panelComment.state == 'closed')
            CommentViewer.show();
    },
    show: function CommentViewer_show(url) {
        if (!url) {
            if (!isHttp) return;
            url = aDoc.location.href;
        }
        commentButton.setAttribute('loading', 'true'); 
        var self = this;
        HTTPCache.comment.async_get(url, function(data) {
            if (!data || !data.title) {
                data = {};
                data.url = data.title = url;
                data.bookmarks = [];
            }
            data.favicon = favicon(data.url);
            self.updateComment(data);
        });
    },
    toggle: function CommentViewer_toggle(url) {
        if (!url && isHttp) {
            url = aDoc.location.href;
        }

        if (panelComment.state != 'close' && url != CommentViewer.currentURL) {
            CommentViewer.show(url);
        } else {
            CommentViewer.hide();
        }
    },
    autoHoverShow: function() {
        if (!CommentViewer.prefs.get('autoHoverShow')) return;

        let url;
        if (!url && isHttp) 
            url = aDoc.location.href;

        // ignore https
        if (url.indexOf('https://') == 0 && Application.prefs.get('extensions.hatenabookmark.statusbar.httpsIgnore').value) return;

        if (isHttp && HTTPCache.counter.has(url)) {
            let count = HTTPCache.counter.get(url);
            if (!(count > 0)) {
                // カウントキャッシュがあった場合、チェックして、ある場合のみ表示
                return;
            }
        }

        if (panelComment.state != 'close' && url != CommentViewer.currentURL)
            CommentViewer.show(url);
    },
    currentURL: null,
    updateComment: function CommentViewer_updateComment(data) {
        CommentViewer.currentURL = data.url;
        // 非表示ユーザをフィルター
        if (User.user) {
            let regex = User.user.ignores;
            if (regex) {
                data.bookmarks = data.bookmarks.filter(function(b) !regex.test(b.user));
            }
        }
        panelComment.setAttribute('hTransparent', true);
        panelComment.openPopup(statusbar, 'before_end', -20, 0,false,false);
        CommentViewer.updateViewer(data);
        commentButton.setAttribute('loading', 'false'); 
    },
    renderComment: function(bookmarks, limit, fragment) {
        if (!fragment) 
            fragment = document.createDocumentFragment();
        let i = 0;
        let len = bookmarks.length;
        let B_URL = 'http://b.hatena.ne.jp/';
        let isFilter = CommentViewer.isFilter;
        let eid = bookmarks.eid;
        while (i++ < Math.min(limit, len)) {
            let b = bookmarks.shift();
            let li = E('li');
            let userlink = B_URL + b.user + '/';
            let ymd = b.timestamp.split(' ')[0];
            let permalink = userlink + ymd.replace(/\//g, '') + '#bookmark-' +  eid;
            let icon = userIcon(b.user);
            li.appendChild(icon);
            let a;
            li.appendChild(a = E('a', {href: permalink}, b.user));
            a.className = 'username';
            if (!isFilter && b.tags) b.tags.forEach(function(tag, index) {
                let userlinkTag = userlink + encodeURIComponent(tag);
                if (index) li.appendChild(document.createTextNode(', '));
                li.appendChild(a = E('a', {href: userlinkTag}, tag));
                a.className = 'tag';
            });
            li.appendChild(a = E('span')); 
            a.innerHTML = b.comment;
            a.className = 'comment'
            li.appendChild(a = E('span', {}, ymd));
            a.className = 'timestamp';
            fragment.appendChild(li);
        }
        return fragment;
    },
    updateViewer: function (data) {
        if (!data) {
            data = CommentViewer.lastData;
        } else {
            CommentViewer.lastData = data;
        }

        let isFilter = CommentViewer.isFilter;
        if (CommentViewer.lastRenderData[0] == data.url && CommentViewer.lastRenderData[1] == isFilter) {
            // data.url が同じ、かつ filter してない
            panelComment.removeAttribute('hTransparent');
            return;
        }
        while(list.firstChild) list.removeChild(list.firstChild);

        let bookmarks = Array.slice(data.bookmarks);
        bookmarks.eid = data.eid;
        if (isFilter) {
            bookmarks = bookmarks.filter(function(b) b.comment.length);
        }
        let fragment = document.createDocumentFragment();
        if (bookmarks.length) {
            CommentViewer.renderComment(bookmarks, 30, fragment);
            if (bookmarks.length) {
                // まだレンダリングする項目があれば、非同期レンダリングをする
                CommentViewer.lazyWriter.reset();
                CommentViewer.lazyWriterBookmarks = bookmarks;
                CommentViewer.lazyWriter.start();
            }
        } else {
             let li = E('li', {} , UIEncodeText('表示できるブックマークコメントはありません。'));
             li.className = 'notice';
             fragment.appendChild(li);
        }
        list.appendChild(fragment);
        faviconImage.src = data.favicon;
        titleLabel.value = data.title || data.url;
        let c = data.count;
        if (c) {
            usersLabel.value = parseInt(data.count) == 0 ? (data.count + ' user') :  data.count + ' users';
        } else {
            usersLabel.value = '';
        }
        setTimeout(function() {
             CommentViewer.updatePosition();
        }, 0);
        CommentViewer.lastRenderData = [data.url, isFilter];
    },
    lastRenderData: [],
    updatePosition: function() {
        let height = list.offsetHeight + 30;
        let h, w;
        if (CommentViewer.prefs.get('autoResize')) {
            let size = Math.max(300, Math.min(window.content.innerWidth - 50, window.content.innerHeight - 50));
            h = w = parseInt(size);
            h = Math.min(h, height);
        } else {
            h = Math.min(CommentViewer.viewerMaxHeight, height);
            w = Math.min(CommentViewer.viewerWidth, window.content.innerWidth - 10);
        }
        p('comment viewer pos:' + h + ', ' + w);
        listContainer.style.height = '' + h + 'px';
        commentContainer.style.width = '' + w + 'px';
        panelComment.removeAttribute('hTransparent');
        setTimeout(function() {
            listDiv.focus()
        }, 10);
    },
    get viewerMaxHeight() {
        return CommentViewer.prefs.get('height');
    },
    get viewerWidth() {
        return CommentViewer.prefs.get('width');
    },
    get hideAfterTimer() {
        if (!CommentViewer._hideAfter) {
            let hideAfter = new Timer(100, 1);
            CommentViewer._hideAfter = hideAfter;
        }
        return CommentViewer._hideAfter;
    },
    hide: function CommentViewer_hide() {
        if (panelComment.state != 'closed') {
            panelComment.hidePopup();
        }
    },
    popupHiddenHandler: function(ev) {
        panelComment.removeEventListener('mouseover', CommentViewer.browserOverHandler, false);
        gBrowser.removeEventListener('mouseover', CommentViewer.popupOverHandler, false);
        window.removeEventListener('mouseout', CommentViewer.windowMouseOutHandler, false);
        CommentViewer.lazyWriter.stop();
        CommentViewer.hideTimer.stop();
        CommentViewer.currentURL = null;
        CommentViewer.lastData = null;
        CommentViewer.hideAfterTimer.reset();
        CommentViewer.hideAfterTimer.start();
    },
    popupShownHandler: function(ev) {
        CommentViewer.hideTimer.stop();
        panelComment.addEventListener('mouseover', CommentViewer.popupOverHandler, false);
        gBrowser.addEventListener('mouseover', CommentViewer.browserOverHandler, false);
        window.addEventListener('mouseout', CommentViewer.windowMouseOutHandler, false);
    },
    get lazyWriter() {
        if (!CommentViewer._lazyTimer) {
            let lazyTimer = new Timer(50);
            lazyTimer.createListener('timer', CommentViewer.lazyTimerHandler);
            CommentViewer._lazyTimer = lazyTimer;
        }
        return CommentViewer._lazyTimer;
    },
    lazyTimerHandler: function(ev) {
        let bs = CommentViewer.lazyWriterBookmarks;
        if (bs && bs.length) {
            let fragment = CommentViewer.renderComment(bs, 50, fragment);
            list.appendChild(fragment);
        }
    },
    windowMouseOutHandler: function(ev) {
        if (!ev.relatedTarget) {
            CommentViewer.popupMouseoutHandler(ev);
        }
    },
    popupOverHandler: function(ev) {
        CommentViewer.hideTimer.stop();
    },
    get hideTimer() {
        if (!CommentViewer._hideTimer) {
            let hideTimer = new Timer(300, 1);
            hideTimer.createListener('timerComplete', CommentViewer.hideTimerCompleteHandler);
            CommentViewer._hideTimer = hideTimer;
        }
        return CommentViewer._hideTimer;
    },
    hideTimerCompleteHandler: function(ev) {
        CommentViewer.hide();
    },
    popupMouseoutHandler: function(ev) {
        if (CommentViewer.prefs.get('autoHoverShow')) {
            let hideTimer = CommentViewer.hideTimer;
            let t = ev.currentTarget;
            let rel = ev.relatedTarget;
            while( rel ) {
                if (rel == t) {
                    hideTimer.stop();
                    return;
                }
                rel = rel.parentNode;
            }
            hideTimer.reset();
            hideTimer.start();
        }
    },
    browserOverHandler: function(ev) {
        if (CommentViewer.prefs.get('autoHoverShow')) {
            let hideTimer = CommentViewer.hideTimer;
            hideTimer.reset();
            hideTimer.start();
        }
    },
    buttonClickHandler: function(ev) {

        if (CommentViewer.hideAfterTimer.running) {
            /*
             * XXX:
             * コメントビュワーの popup が autohide によって、クリックされると閉じられるため
             * タイマーをチェックし、
             * 非表示にされた直後なら、なにもしない
             */
        } else {
            CommentViewer.toggle();
        }
    },
    loadHandler: function CommentViewer_loadHandler() {
        commentButton.addEventListener('mousedown', CommentViewer.buttonClickHandler, true);
        panelComment.addEventListener('popuphidden', CommentViewer.popupHiddenHandler, false);
        panelComment.addEventListener('popupshown', CommentViewer.popupShownHandler, false);
        // panelComment.addEventListener('mouseout', CommentViewer.popupMouseoutHandler, false);
        listDiv.addEventListener('click', CommentViewer.listClickHandler, true);
        CommentViewer.updateToggle();
    },
    listClickHandler: function CommentViewer_listClickHandler(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        if (ev.target.alt == 'close') {
            CommentViewer.hide();
            return;
        }
        let link = CommentViewer.getHref(ev.target);
        if (link) {
            hOpenUILink(link, ev);
        }
    },
    goEntry: function(ev) {
        let url = CommentViewer.currentURL || CommentViewer.lastRenderData[0];
        hOpenUILink(entryURL(url), ev);
    },
    getHref: function (el) {
        if (typeof el.href != 'undefined') {
            return el.href;
        } else if (el.parentNode) {
            return CommentViewer.getHref(el.parentNode);
        } else {
            return null;
        }
    },
}

EventService.createListener('load', CommentViewer.loadHandler);


