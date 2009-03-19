
const EXPORT = ['CommentViewer'];

let commentCache = new ExpireCache('uComment', 60 * 60, 'uneval'); // 一時間キャッシュ

// local utility 
this.__defineGetter__('aWin', function() Application.activeWindow);
this.__defineGetter__('aDoc', function() Application.activeWindow.activeTab.document);
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);

let iframe = null;

elementGetter(this, 'panelComment', 'hBookmark-panel-comment', document);
elementGetter(this, 'commentButton', 'hBookmark-status-comment', document);

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
    show: function CommentViewer_show(target) {
        if (!isHttp) return;

        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.setAttribute('src', 'chrome://hatenabookmark/content/comment.html') 
            iframe.setAttribute('id', 'hBookmark-comment-viewer');

            panelComment.appendChild(iframe);
        }

        let url = aDoc.location.href;
        commentButton.setAttribute('loading', 'true'); 
        let data = HTTPCache.comment.get(url);
        this.updateComment(data);
    },
    updateComment: function CommentViewer_updateComment(data) {
        if (data) {
            panelComment.openPopup(commentButton, 'before_end', 0, 0,false,false);
            // XXX: 非表示ユーザをフィルター
            throwEvent('load-json', data);
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
        if (o.height < 400) {
            panelComment.setAttribute('height', '' + o.height + 'px');
            iframe.setAttribute('height', '' + o.height + 'px');
        } else {
            panelComment.setAttribute('height', '400px');
            iframe.setAttribute('height', '400px');
        }
    }
}

