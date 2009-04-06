
/*
 * ToDo: iframe ではなく XUL で描画するが、XUL の時の複数要素の折り返しをどうするか…
 */

const EXPORT = ['CommentViewer'];

const SHOW_PREFS_NAME = 'extensions.hatenabookmark.commentviewer.allShow';

let commentCache = new ExpireCache('uComment', 60 * 60, 'uneval'); // 一時間キャッシュ

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
        Application.prefs.get(SHOW_PREFS_NAME).value = !Application.prefs.get(SHOW_PREFS_NAME).value;
        CommentViewer.updateToggle();
        CommentViewer.updateViewer();
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
        return !Application.prefs.get(SHOW_PREFS_NAME).value;
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
    currentURL: null,
    updateComment: function CommentViewer_updateComment(data) {
        CommentViewer.updatePosition();
        CommentViewer.currentURL = data.url;
        panelComment.openPopup(statusbar, 'before_end', -20, 0,false,false);
        // 非表示ユーザをフィルター
        if (User.user) {
            let regex = User.user.ignores;
            if (regex) {
                data.bookmarks = data.bookmarks.filter(function(b) !regex.test(b.user));
            }
        }
        CommentViewer.updateViewer(data);
        commentButton.setAttribute('loading', 'false'); 
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
            return;
        }
        while(list.firstChild) list.removeChild(list.firstChild);

        let B_URL = 'http://b.hatena.ne.jp/';
        let bookmarks = Array.slice(data.bookmarks);
        if (isFilter) {
            bookmarks = bookmarks.filter(function(b) b.comment.length);
        }
        let len = bookmarks.length;
        let fragment = document.createDocumentFragment();
        if (len) {
            p.b(function() {
            for (let i = 0;  i < len; i++) {
                let b = bookmarks[i];
                let li = E('li');
                let userlink = B_URL + b.user + '/';
                let ymd = b.timestamp.split(' ')[0];
                let permalink = userlink + ymd.replace(/\//g, '') + '#bookmark-' + data.eid;
                let icon = userIcon(b.user);
                li.appendChild(icon);
                let a;
                li.appendChild(a = E('a', {href: permalink}, b.user));
                a.className = 'username';
                if (!isFilter && b.tags) b.tags.forEach(function(tag, index) {
                    let userlinkTag = userlink + 't/' + encodeURIComponent(tag);
                    if (index) li.appendChild(document.createTextNode(', '));
                    li.appendChild(a = E('a', {href: userlinkTag}, tag));
                    a.className = 'tag';
                });
                li.appendChild(a = E('span', {}, b.comment)); 
                a.className = 'comment'
                fragment.appendChild(li);
            }
            }, 'rendering comment (' + len + ') items ');
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
        let h = Math.min(CommentViewer.viewerMaxHeight, height);
        let w = Math.min(CommentViewer.width, window.content.innerWidth - 10);
        listContainer.style.height = '' + h + 'px';
        listContainer.style.width = '' + w + 'px';
    },
    get viewerMaxHeight() {
        return Application.prefs.get('extensions.hatenabookmark.commentviewer.height').value;
    },
    get viewerWidth() {
        return Application.prefs.get('extensions.hatenabookmark.commentviewer.width').value;
    },
    hide: function CommentViewer_hide() {
        if (panelComment.state != 'closed') {
            panelComment.hidePopup();
        }
    },
    popupHiddenHandler: function(ev) {
        CommentViewer.currentURL = null;
        CommentViewer.lastData = null;
    },
    loadHandler: function CommentViewer_loadHandler() {
        panelComment.addEventListener('popuphidden', CommentViewer.popupHiddenHandler, false);
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
            openUILink(link, ev);
        }
    },
    goEntry: function(ev) {
        let url = CommentViewer.currentURL || CommentViewer.lastRenderData[0];
        openUILink(entryURL(url), ev);
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

/*
CommentViewer.dispatchMethods = {
    close: function() {
        CommentViewer.hide();
    },
    rendered: function(o) {
        // let doc = window.content.document;
        // let maxHeight = (doc.compatMode == 'CSS1Compat' ? doc.documentElement.clientHeight : doc.body.clientHeight) - 40;
        let maxHeight = window.content.innerHeight - 40;
        let maxWidth = window.content.innerWidth - 40;
        if (o.height < 100)
            o.height = 100;
        if (o.height < maxHeight) {
            panelComment.setAttribute('height', '' + o.height + 'px');
            CommentViewer.iframe.setAttribute('height', '' + o.height + 'px');
        } else {
            panelComment.setAttribute('height', '' + maxHeight + 'px');
            CommentViewer.iframe.setAttribute('height',  '' + maxHeight + 'px');
        }
        panelComment.setAttribute('width', '' + maxWidth + 'px');
        CommentViewer.iframe.setAttribute('width', '' + maxWidth + 'px');
    }
}
*/

EventService.createListener('load', CommentViewer.loadHandler);

// window.addEventListener('load', function() {
//     p('init create commentViewer iframe');
//     CommentViewer.createIFrame();
// }, false);


