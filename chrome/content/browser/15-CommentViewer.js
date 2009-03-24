
const EXPORT = ['CommentViewer'];

let commentCache = new ExpireCache('uComment', 60 * 60, 'uneval'); // 一時間キャッシュ

// local utility 
this.__defineGetter__('aWin', function() Application.activeWindow);
this.__defineGetter__('aDoc', function() Application.activeWindow.activeTab.document);
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);

let iframe = null;

elementGetter(this, 'panelComment', 'hBookmark-panel-comment', document);
elementGetter(this, 'commentButton', 'hBookmark-status-comment', document);
elementGetter(this, 'statusbar', 'status-bar', document);

const CMD_EVENT_NAME = 'hBookmark-view-comments';

window.addEventListener(CMD_EVENT_NAME, function(ev) {
    let m = CommentViewer.dispatchMethods[ev.getData('method')];
    if (m) m(ev.getData('data'));
}, false);

let throwEvent = function(method, data) {
     let ev = window.document.createEvent('DataContainerEvent');
     ev.initEvent(CMD_EVENT_NAME, false, false);
     ev.setData('method', method);
     ev.setData('data', data);
     window.dispatchEvent(ev);
}

var CommentViewer = {
    showClick: function CommentViewer_show() {
        if (panelComment.state == 'closed')
            CommentViewer.show();
    },
    show: function CommentViewer_show(url) {
        if (!url) {
            if (!isHttp) return;
            url = aDoc.location.href;
        }
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.setAttribute('src', 'chrome://hatenabookmark/content/comment.html') 
            iframe.setAttribute('id', 'hBookmark-comment-viewer');

            panelComment.appendChild(iframe);
        }
        commentButton.setAttribute('loading', 'true'); 
        let data = HTTPCache.comment.get(url);
        if (data)
            data.favicon = favicon(url);
        setTimeout(function(self) {
            self.updateComment(data);
        }, 10, this);
    },
    updateComment: function CommentViewer_updateComment(data) {
        if (data && data.title) {
            panelComment.openPopup(commentButton, 'before_end', 0, 0,false,false);
            // 非表示ユーザをフィルター
            let regex = User.user.ignores;
            if (regex) {
                data.bookmarks = data.bookmarks.filter(function(b) !regex.test(b.user));
            }
            //if (data.bookmarks && data.bookmarks.length) {
                throwEvent('load-json', data);
            //} else {
            //    CommentViewer.hide();
            //}
        }
        commentButton.setAttribute('loading', 'false'); 
    },
    hide: function CommentViewer_hide() {
        if (panelComment.state != 'closed') {
            panelComment.hidePopup();
        }
    }
}

CommentViewer.dispatchMethods = {
    close: function() {
        CommentViewer.hide();
    },
    rendered: function(o) {
        // let doc = window.content.document;
        // let maxHeight = (doc.compatMode == 'CSS1Compat' ? doc.documentElement.clientHeight : doc.body.clientHeight) - 40;
        let maxHeight = window.content.innerHeight - 80;
        let maxWidth = window.content.innerWidth - 80;
        if (o.height < maxHeight) {
            panelComment.setAttribute('height', '' + o.height + 'px');
            iframe.setAttribute('height', '' + o.height + 'px');
        } else {
            panelComment.setAttribute('height', '' + maxHeight + 'px');
            iframe.setAttribute('height',  '' + maxHeight + 'px');
        }
        panelComment.setAttribute('width', '' + maxWidth + 'px');
        iframe.setAttribute('width', '' + maxWidth + 'px');
    }
}

