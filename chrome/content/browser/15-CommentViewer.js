
const EXPORT = ['CommentViewer'];

let commentCache = new ExpireCache('uComment', 60 * 60, 'uneval'); // 一時間キャッシュ

// local utility 
this.__defineGetter__('aWin', function() Application.activeWindow);
this.__defineGetter__('aDoc', function() Application.activeWindow.activeTab.document);
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);

let iframe = document.createElement('iframe');
iframe.setAttribute('src', 'chrome://hatenabookmark/content/comment.html') 
iframe.setAttribute('id', 'hBookmark-comment-viewer');
iframe.setAttribute('width', '400px');
iframe.setAttribute('height', '400px');

elementGetter(this, 'panelComment', 'hBookmark-panel-comment', document);
elementGetter(this, 'commentButton', 'hBookmark-status-comment', document);

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
        let ev = document.createEvent('DataContainerEvent');
        ev.initEvent('hBookmark-view-comments', false, false);
        ev.setData('data', data);
        window.dispatchEvent(ev);
    },
}

EventService.createListener('load', function(e) {
    panelComment.appendChild(iframe);
}, window);

/*
    showComment: function StatusBar_showComment() {
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
        xhr.open('GET', reqURL, true); // XXX
        xhr.send(null);
    },
    updateComment: function StatusBar_updateComment() {
        let json = commentCache.get(aDoc.location.href);

        this.updateIFrame(json);
    },
    updateIFrame: function StatusBar_updateIFrame(json) {
        let iframe = this.iframe;
        iframe.update(json);
        panelComment.openPopup(addButton, 'before_end', 0, 0,false,false);
    },
    get iframe() {
        if (!this._iframe) {
            let iframe = CommentIFrame;
            panelComment.appendChild(iframe.iframe);
            this._iframe = iframe;
        }
        return this._iframe;
    },

let CommentIFrame = {
    get iframe() {
        if (!this._iframe) {
            let iframe = document.createElement('iframe');
            iframe.setAttribute('src', 'chrome://hatenabookmark/content/comment.html') 
            iframe.setAttribute('id', 'hBookmark-comment-iframe');
            iframe.setAttribute('width', 400);
            iframe.setAttribute('height', 400);
            this._iframe = iframe;
            window.addEventListener('iframeLinkOpen', function(ev) {
                p('open!');
                p(ev.data);
                p(keys(ev));
            }, false);
        }
        return this._iframe;
    },
    update: function(data) {
    }
}

*/


