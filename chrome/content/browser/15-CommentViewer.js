
const EXPORT = ['CommentViewer'];

// local utility 
this.__defineGetter__('aWin', function() getTopWin());
this.__defineGetter__('aDoc', function() getTopWin().gBrowser.contentDocument);
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
elementGetter(this, 'usersPubPriLabel', 'hBookmark-comment-pub-pri-users', document);
elementGetter(this, 'starsLabel', 'hBookmark-comment-stars', document);
elementGetter(this, 'toggleImage', 'hBookmark-comment-toggle', document);
elementGetter(this, 'starTooltip', 'hBookmark-star-tooltip', document);
elementGetter(this, 'starTooltipIcon', 'hBookmark-star-tooltip-icon', document);
elementGetter(this, 'starTooltipUser', 'hBookmark-star-tooltip-user', document);
elementGetter(this, 'starTooltipQuote', 'hBookmark-star-tooltip-quote', document);
elementGetter(this, 'pageStarsContainer', 'hBookmark-comment-page-stars-container', document);
elementGetter(this, 'extendedPageStarsContainer', 'hBookmark-comment-extended-page-stars-container', document);

const S_HTTP = 'http://s.hatena.ne.jp/';

let userIcon = function(username) {
    return E('img', {
        src: UserUtils.getProfileIcon(username),
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
        CommentViewer.updateViewer(null, true);
    },
    get prefs() {
        if (!CommentViewer._prefs) {
            CommentViewer._prefs = new Prefs('extensions.hatenabookmark.commentviewer.');
        }
        return CommentViewer._prefs;
    },
    updateToggle: function() {
        CommentViewer.updateImage(CommentViewer.isFilter);
    },
    updateImage: function(filterd) {
        let src;
        if (filterd) {
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

        if (!HTTPCache.counter.isValid(url)) {
            // valid でない URL なら、自動コメント機能を無効に
            return;
        }

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
        data.publicCount = data.bookmarks.length;
        data.privateCount = data.count - data.publicCount;
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
        // XXX コメント文字列をそのままHTMLとして扱うと、
        // 場当たり的な対応が増えてよろしくないので、後で修正したい。
        //let URLRegex = new RegExp("\\b((?:http|https|ftp)://[A-Za-z0-9~/._\?\&=\\-%#\+:\;,\@\']+)", 'g');
        let htmlEscapedURLRegex = /\b(?:https?|ftp):\/\/(?:[A-Za-z0-9~\/._?=\-%#+:;,@\']|&(?!lt;|gt;|quot;))+/g;
        while (i++ < Math.min(limit, len)) {
            let b = bookmarks.shift();
            let li = E('li');
            let userlink = B_URL + b.user + '/';
            let ymd = b.timestamp.split(' ')[0];
            let permalink = userlink + ymd.replace(/\//g, '') + '#bookmark-' +  eid;
            let icon = userIcon(b.user);
            li.appendChild(icon);
            let container = E('span', {class: 'comment-container'});
            let a;
            container.appendChild(a = E('a', {href: permalink}, b.user));
            a.className = 'username';
            if (!isFilter && b.tags) b.tags.forEach(function(tag, index) {
                let userlinkTag = userlink + encodeURIComponent(tag);
                if (index) container.appendChild(document.createTextNode(', '));
                container.appendChild(E('a', {href: userlinkTag, class: 'tag'}, tag));
            });
            container.appendChild(a = E('span'));
            a.innerHTML = b.comment.replace(/&/g, '&amp;').
                   replace(/</g, '&lt;').
                   replace(/>/g, '&gt;').
                   replace(/\"/g, '&quot;').
                   replace(htmlEscapedURLRegex, function(m) {
                return '<a class="commentlink" href="' + m + '">' + m + '</a>';
            });
            a.className = 'comment'
            li.appendChild(container);
            li.appendChild(a = E('span', {}, ymd));
            a.className = 'timestamp';
            fragment.appendChild(li);
            CommentViewer.commentElements[b.user] = li;
        }
        return fragment;
    },
    updateViewer: function (data, ignoreAutoFilter) {
        if (!data) {
            data = CommentViewer.lastData;
        } else {
            CommentViewer.lastData = data;
        }

        let autoFilter = CommentViewer.autoFilter;
        if (autoFilter && !ignoreAutoFilter) {
            // 閾値以下なら、Filter しない
            if (data.bookmarks.length < autoFilter) {
                CommentViewer.prefs.set('showAll', true);
                CommentViewer.updateImage(false);
            } else {
                CommentViewer.prefs.set('showAll', false);
                CommentViewer.updateImage(true);
            }
        }
        let isFilter = CommentViewer.isFilter;

        // スターの表示は、ポップアップ表示ごとに新しく行う。ただし、
        // ポップアップを開いたわけではなく、単にコメントなしブックマークの
        // 表示表示を切り替えているだけのときは、対象ページにつけられた
        // スターの表示を更新しない。
        let loadPageStars = CommentViewer.lastRenderData[0] !== data.url ||
                            (!pageStarsContainer.hasChildNodes() &&
                             !extendedPageStarsContainer.hasChildNodes())
        if (loadPageStars) {
            pageStarsContainer.setAttribute('loading', true);
        }
        CommentViewer._pendingStarEntries = [];
        CommentViewer.starLoader = new StarLoader();
        CommentViewer.starLoader.loadBookmarkStar(data, isFilter, loadPageStars,
                                                  CommentViewer.loadStarHandler);

        if (CommentViewer.lastRenderData[0] == data.url && CommentViewer.lastRenderData[1] == isFilter) {
            // data.url が同じ、かつ filter してない
            panelComment.removeAttribute('hTransparent');
            return;
        }
        while(list.firstChild) list.removeChild(list.firstChild);
        CommentViewer.commentElements = {};

        let bookmarks = Array.slice(data.bookmarks);
        let eid = bookmarks.eid = data.eid;

        if (isFilter) {
            bookmarks = bookmarks.filter(function(b) b.comment);
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
            // XXX Needs localization!
            let li = E('li', {} , UIEncodeText('表示できるブックマークコメントはありません。'));
            li.className = 'notice';
            fragment.appendChild(li);
        }
        list.appendChild(fragment);
        faviconImage.src = data.favicon;
        let title = decodeReferences(data.title) || data.url;
        titleLabel.value = title;
        titleLabel.tooltipText = title;
        let c = data.count;
        if (c) {
            usersLabel.value = parseInt(data.count) == 0 ? (data.count + ' user') :  data.count + ' users';
            if (data.privateCount) {
                usersPubPriLabel.value = '(' + data.publicCount + ' + ' + data.privateCount + ')';
            } else {
                usersPubPriLabel.value = '';
            }
        } else {
            usersLabel.value = '';
            usersPubPriLabel.value = '';
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
    get autoFilter() {
        if (CommentViewer.prefs.get('autoFilter')) {
            return CommentViewer.prefs.get('autoFilterThreshold');
        } else {
            return false;
        }
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
        if (ev.eventPhase !== Event.AT_TARGET) return;
        panelComment.removeEventListener('mouseover', CommentViewer.popupOverHandlerFirst, false);
        panelComment.removeEventListener('mouseover', CommentViewer.popupOverHandler, false);
        gBrowser.removeEventListener('mouseover', CommentViewer.browserOverHandler, false);
        window.removeEventListener('mouseout', CommentViewer.windowMouseOutHandler, false);
        CommentViewer.lazyWriter.stop();
        CommentViewer.hideTimer.stop();
        CommentViewer.currentURL = null;
        CommentViewer.lastData = null;
        CommentViewer.hideAfterTimer.reset();
        CommentViewer.hideAfterTimer.start();
        CommentViewer.starLoader = null;
        UIUtils.deleteContents(pageStarsContainer);
        UIUtils.deleteContents(extendedPageStarsContainer);
        pageStarsContainer.style.display = '';
    },
    popupShownHandler: function(ev) {
        if (ev.eventPhase !== Event.AT_TARGET) return;
        CommentViewer.hideTimer.stop();
        panelComment.addEventListener('mouseover', CommentViewer.popupOverHandlerFirst, false);
        panelComment.addEventListener('mouseover', CommentViewer.popupOverHandler, false);
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
            CommentViewer.renderPendingStars();
        }
    },
    windowMouseOutHandler: function(ev) {
        if (!ev.relatedTarget) {
            CommentViewer.popupMouseoutHandler(ev);
        }
    },
    popupOverHandlerFirst: function(ev) {
        /*
         * first を作ってるのは、一度コメントビュワーのパネルにマウスオーバーしてから
         * hidden を有効にするため。これをしないと、右クリック拡張からコメントビュワー表示時に
         * マウスを少し動かすだけで消えるようになってしまう
         */
        panelComment.removeEventListener('mouseover', CommentViewer.popupOverHandlerFirst, false);
        gBrowser.addEventListener('mouseover', CommentViewer.browserOverHandler, false);
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
        p(['bclick', ev.button]);
        if (ev.button == 2) return; // 右クリック

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
        pageStarsContainer.addEventListener('click', CommentViewer.listClickHandler, true);
        extendedPageStarsContainer.addEventListener('click', CommentViewer.listClickHandler, true);
        CommentViewer.updateToggle();
        panelComment.addEventListener('mouseover', CommentViewer.mouseOverHandler, false);
        panelComment.addEventListener('mouseout', CommentViewer.mouseOutHandler, false);
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
            return;
        }
        if (/\binner-count\b/.test(ev.target.className) &&
            !ev.target.parentNode.isLoading) {
            CommentViewer.starLoader.loadAllStars(ev.target.targetURL, method(CommentViewer, 'loadStarHandler'));
            ev.target.parentNode.isLoading = true;
            return;
        }
    },
    mouseOverHandler: function CommentViewer_mouseOverHandler(event) {
        let star = event.target;
        if (star instanceof Ci.nsIDOMHTMLImageElement)
            star = star.parentNode;
        if (star.className !== 'star' || !star.user) return;
        starTooltipIcon.src = UserUtils.getProfileIcon(star.user);
        starTooltipUser.value = star.user;
        if (star.quote) {
            // XXX Needs localization of quotation marks.
            starTooltipQuote.textContent = '"' + star.quote + '"';
            starTooltipQuote.collapsed = false;
            if (star.forComment) {
                let li = star.parentNode.parentNode;
                if (!star.originalComment) {
                    star.originalComment = li.getElementsByClassName('comment-container').item(0);
                    star.highlightedComment = CommentViewer.createHighlightedComment(star.originalComment, star.quote);
                }
                li.replaceChild(star.highlightedComment, star.originalComment);
            }
        } else {
            starTooltipQuote.collapsed = true;
        }
        starTooltip.openPopup(star, 'after_start', 0, 0, false, false);
        CommentViewer.currentStar = star;
    },
    mouseOutHandler: function CommentViewer_mouseOutHandler(event) {
        let star = CommentViewer.currentStar;
        if (!star) return;
        let dest = event.relatedTarget;
        if (CommentViewer.isInStarTooltip(dest)) return;
        CommentViewer.currentStar = null;
        if (star.highlightedComment &&
            star.highlightedComment.parentNode) {
            star.highlightedComment.parentNode.replaceChild(
                star.originalComment, star.highlightedComment);
        }
        starTooltip.hidePopup();
    },
    isInStarTooltip: function CommentViewer_isInStarTooltip(element) {
        for (let i = 0; element && i++ < 3; element = element.parentNode)
            if (element === starTooltip)
                return true;
        return false;
    },
    createHighlightedComment: function CommentViewer_createHighlightedComment(base, keyword) {
        let comment = base.cloneNode(true);
        let texts = document.evaluate('*/text()', comment, null,
                                      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < texts.snapshotLength; i++) {
            let text = texts.snapshotItem(i);
            while (text) {
                let start = text.data.indexOf(keyword);
                if (start === -1) break;
                let keywordText = text.splitText(start);
                let restText = keywordText.splitText(keyword.length);
                let em = E('em', { class: 'highlight' });
                text.parentNode.replaceChild(em, keywordText);
                em.appendChild(keywordText);
                text = restText;
            }
        }
        return comment;
    },
    _pendingStarEntries: [],
    renderStar: function CommentViewer_renderStar(entry) {
        let url = entry.uri;
        let user = url.substring(B_HTTP.length, url.indexOf('/', B_HTTP.length));
        let li = CommentViewer.commentElements[user];
        if (!li) {
            CommentViewer._pendingStarEntries.push(entry);
            return;
        }
        let container = CommentViewer.createStarElements(entry, true);
        let oldContainer = li.getElementsByClassName('star-container').item(0);
        if (oldContainer) {
            li.replaceChild(container, oldContainer);
        } else {
            li.appendChild(document.createTextNode(' '));
            li.appendChild(container);
        }
    },
    createStarElements: function CommentViewer_createStarElements(entry,
                                                                  forComment) {
        let starsList = [];
        if (entry.colored_stars)
            starsList = entry.colored_stars.concat();
        if (entry.stars)
            starsList.push({ color: 'yellow', stars: entry.stars });
        let container = E('span', { class: 'star-container' });
        starsList.forEach(function (stars) {
            let image = S_HTTP + 'images/star' +
                (stars.color === 'yellow' ? '' : '-' + stars.color) + '.gif';
            stars.stars.forEach(function (star) {
                if (typeof star === 'number') {
                    let span = E('span', { class: 'inner-count ' + stars.color }, star);
                    span.targetURL = entry.uri;
                    container.appendChild(span);
                } else {
                    // \u2606 is a star (☆)
                    let a = E('a', { class: 'star', href: S_HTTP + star.name + '/' },
                              E('img', { src: image, alt: '\u2606' }));
                    a.user = star.name;
                    a.quote = star.quote;
                    a.forComment = forComment;
                    container.appendChild(a);
                    // XXX Do something with |star.count|.
                }
            }, this);
        }, this);
        return container;
    },
    renderPendingStars: function CommentViewer_renderPendingStars() {
        let entries = CommentViewer._pendingStarEntries;
        CommentViewer._pendingStarEntries = [];
        entries.forEach(function (entry) this.renderStar(entry), this);
    },
    renderPageStar: function CommentViewer_renderPageStar(entry) {
        var starElements = CommentViewer.createStarElements(entry, false);
        if (pageStarsContainer.hasChildNodes()) {
            pageStarsContainer.firstChild.isLoading = false;
            UIUtils.deleteContents(extendedPageStarsContainer);
            extendedPageStarsContainer.appendChild(starElements);
            pageStarsContainer.style.display = 'none';
            return;
        }
        pageStarsContainer.removeAttribute('loading');
        UIUtils.deleteContents(pageStarsContainer);
        pageStarsContainer.appendChild(starElements);
    },
    _starLoader: null,
    get starLoader() CommentViewer._starLoader,
    set starLoader(loader) {
        let currentLoader = CommentViewer._starLoader;
        if (loader === currentLoader) return loader;
        if (currentLoader && currentLoader.destroy)
            currentLoader.destroy();
        return CommentViewer._starLoader = loader;
    },
    loadStarHandler: function CommentViewer_loadStarHandler(entry) {
        let url = entry.uri;
        if (url === CommentViewer.lastRenderData[0]) {
            CommentViewer.renderPageStar(entry);
            return;
        }
        CommentViewer.renderStar(entry);
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


