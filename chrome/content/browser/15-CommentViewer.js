
const EXPORT = ['CommentViewer'];

let commentCache = new ExpireCache('uComment', 60 * 60, 'uneval'); // 一時間キャッシュ

// local utility 
this.__defineGetter__('aWin', function() Application.activeWindow);
this.__defineGetter__('aDoc', function() Application.activeWindow.activeTab.document);
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);

let iframe = document.createElement('iframe');
iframe.setAttribute('src', 'chrome://hatenabookmark/content/comment.html') 
iframe.setAttribute('id', 'hBookmark-comment-viewer');

elementGetter(this, 'panelComment', 'hBookmark-panel-comment', document);
elementGetter(this, 'commentButton', 'hBookmark-status-comment', document);

const CMD_EVENT_NAME = 'hBookmark-view-comments';

window.addEventListener(CMD_EVENT_NAME, function(ev) {
    let m = CommentViewer.dispatchMethods[ev.getData('method')];
    if (m) m(ev.getData('data'));
}, false);

throwEvent = function(method, data) {
     let ev = window.document.createEvent('DataContainerEvent');
     ev.initEvent(CMD_EVENT_NAME, false, false);
     ev.setData('method', method);
     ev.setData('data', data);
     window.dispatchEvent(ev);
}

var CommentViewer = {
    show: function CommentViewer_show(target) {
        if (!isHttp) return;

        let url = aDoc.location.href;
        if (commentCache.has(url)) 
            return this.updateComment();

        let reqURL = 'http://b.hatena.ne.jp/entry/json/?url=' + encodeURIComponent(url);
        let xhr = new XMLHttpRequest();
        let self = this;
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                commentCache.set(url, eval('(' + xhr.responseText + ')'));
                self.updateComment();
            }
        };
        xhr.open('GET', reqURL, true);
        xhr.send(null);
    },
    updateComment: function CommentViewer_updateComment() {
        let data = commentCache.get(aDoc.location.href);
        panelComment.openPopup(commentButton, 'before_end', 0, 0,false,false);
        throwEvent('load-json', data);
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

EventService.createListener('load', function(e) {
    panelComment.appendChild(iframe);
}, window);

