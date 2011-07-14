
const EXPORT = ['CommentViewer'];

// local utility 
this.__defineGetter__('aWin', function() getTopWin());
this.__defineGetter__('aDoc', function() getTopWin().gBrowser.contentDocument);
this.__defineGetter__('isHttp', function() aDoc && aDoc.location.protocol.indexOf('http') == 0);

let E = createElementBindDocument(document, XHTML_NS);

elementGetter(this, 'panelComment', 'hBookmark-panel-comment', document);
elementGetter(this, 'commentButton', 'hBookmark-status-comment', document);
elementGetter(this, 'commentContainer', 'hBookmark-comment-container', document);
elementGetter(this, 'commentFooter', 'hBookmark-comment-footer', document);
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
elementGetter(this, 'starsLoadingIndicator', 'hBookmark-comment-stars-loading-indicator', document);
elementGetter(this, 'pageStarsBox', 'hBookmark-comment-page-stars-box', document);
elementGetter(this, 'pageStarsContainer', 'hBookmark-comment-page-stars-container', document);
elementGetter(this, 'expandedPageStarsBox', 'hBookmark-comment-expanded-page-stars-box', document);
elementGetter(this, 'expandedPageStarsContainer', 'hBookmark-comment-expanded-page-stars-container', document);

let userIcon = function(username) {
    return E('img', {
        src: UserUtils.getProfileIcon(username),
        className: 'usericon',
        width: '16px',
        height: '16px',
        alt: username,
    });
}

let strings = new Strings('chrome://hatenabookmark/locale/commentViewer.properties');

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
        let src, tooltip;
        if (filterd) {
            src = "chrome://hatenabookmark/skin/images/comment-viewer-toggle-off.png";
            tooltip = strings.get('showAllBookmarksTooltip');
        } else {
            src = "chrome://hatenabookmark/skin/images/comment-viewer-toggle-on.png";
            tooltip = strings.get('showCommentedBookmarksTooltip');
        }
        toggleImage.src = src;
        toggleImage.tooltipText = tooltip;
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
        let htmlEscapedURLRegex = /\b(?:https?|ftp):\/\/(?:[A-Za-z0-9~\/._?=\-%#+:;,@\'*$!]|&(?!lt;|gt;|quot;))+/g;
        let starCreator = CommentViewer.starCreator;
        let highlightContainerClass = Star.classes.HIGHLIGHT_CONTAINER;
        while (i++ < Math.min(limit, len)) {
            let b = bookmarks.shift();
            let li = E('li');
            let userlink = B_URL + b.user + '/';
            let ymd = b.timestamp.split(' ')[0];
            let permalink = userlink + ymd.replace(/\//g, '') + '#bookmark-' +  eid;
            let icon = userIcon(b.user);
            li.appendChild(icon);
            let container = E('span', {class: highlightContainerClass});
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
            li.appendChild(document.createTextNode(' '));
            li.appendChild(starCreator.createPlaceholder(permalink));
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
                             !expandedPageStarsContainer.hasChildNodes())
        if (loadPageStars) {
            starsLoadingIndicator.collapsed = false;
            pageStarsBox.collapsed = true;
        }
        CommentViewer._pendingStarEntries = [];
        CommentViewer.starLoader = new Star.Loader();
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
        if (isFilter) {
            bookmarks = bookmarks.filter(function(b) b.comment);
        }
        let eid = bookmarks.eid = data.eid;

        let title = decodeReferences(data.title) || data.url;
        CommentViewer.starCreator = new Star.Creator(title, entryURL(data.url));

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
            let li = E('li', {} , strings.get('noBookmarkLabel'));
            li.className = 'notice';
            fragment.appendChild(li);
        }
        list.appendChild(fragment);
        faviconImage.src = data.favicon;
        titleLabel.value = title;
        titleLabel.tooltipText = title;
        let c = +data.count;
        if (c) {
            usersLabel.value = UIUtils.getUsersText(c);
            usersLabel.collapsed = false;
            if (data.privateCount) {
                usersPubPriLabel.value = '(' + data.publicCount + ' + ' + data.privateCount + ')';
                usersPubPriLabel.collapsed = false;
            } else {
                usersPubPriLabel.collapsed = true;
            }
        } else {
            usersLabel.collapsed = true;
            usersPubPriLabel.collapsed = true;
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
        UIUtils.deleteContents(expandedPageStarsContainer);
        starsLoadingIndicator.collapsed = false;
        pageStarsBox.collapsed = true;
        expandedPageStarsBox.collapsed = true;
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
        CommentViewer.updateToggle();
        panelComment.addEventListener('click', Star.onClick, false);
        panelComment.addEventListener('mouseover', Star.onMouseOver, false);
        panelComment.addEventListener('mouseout', Star.onMouseOut, false);
        commentFooter.addEventListener(Star.EVENT_STAR_ACTIVATED,
            CommentViewer.starActivatedHandler, false);
        commentFooter.addEventListener(Star.EVENT_STAR_INNER_COUNT_ACTIVATED,
            CommentViewer.pageStarInnerCountHandler, false);
        listDiv.addEventListener(Star.EVENT_STAR_INNER_COUNT_ACTIVATED,
            CommentViewer.starInnerCountHandler, false);
        
    },
    listClickHandler: function CommentViewer_listClickHandler(ev) {
        if (ev.target.alt == 'close') {
            CommentViewer.hide();
            ev.stopPropagation();
            ev.preventDefault();
            return;
        }
        let link = CommentViewer.getHref(ev.target);
        if (link) {
            hOpenUILink(link, ev);
            ev.stopPropagation();
            ev.preventDefault();
            return;
        }
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
        let stars = CommentViewer.starCreator.createForEntry(entry, true);
        let oldStars = li.getElementsByClassName(Star.classes.CONTAINER).item(0);
        if (oldStars) {
            li.replaceChild(stars, oldStars);
        } else {
            li.appendChild(document.createTextNode(' '));
            li.appendChild(stars);
        }
    },
    renderPendingStars: function CommentViewer_renderPendingStars() {
        let entries = CommentViewer._pendingStarEntries;
        CommentViewer._pendingStarEntries = [];
        entries.forEach(function (entry) this.renderStar(entry), this);
    },
    renderPageStar: function CommentViewer_renderPageStar(entry) {
        let stars = CommentViewer.starCreator.createForEntry(entry, false);
        pageStarsContainer.appendChild(stars);
        starsLoadingIndicator.collapsed = true;
        pageStarsBox.collapsed = false;
    },
    renderExpandedPageStar: function CommentViewer_renderExpandedPageStar(entry) {
        let stars = CommentViewer.starCreator.createForEntry(entry, false);
        expandedPageStarsContainer.appendChild(stars);
        pageStarsBox.collapsed = true;
        expandedPageStarsBox.collapsed = false;
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
    loadStarHandler: function CommentViewer_loadStarHandler(entry,
                                                            isPageStars) {
        if (isPageStars)
            CommentViewer.renderPageStar(entry);
        else
            CommentViewer.renderStar(entry);
    },
    loadPageStarHandler: function CommentViewer_loadPageStarHandler(entry) {
        CommentViewer.renderExpandedPageStar(entry);
    },
    starActivatedHandler: function CV_starActivatedHandler(event) {
        hOpenUILink(event.target.href, event);
    },
    starInnerCountHandler: function CV_starInnerCountHandler(event) {
        CommentViewer.commonInnerCountHandler(event.target,
                                              CommentViewer.loadStarHandler);
    },
    pageStarInnerCountHandler: function CV_pageStarInnerCountHandler(event) {
        CommentViewer.commonInnerCountHandler(event.target,
                                              CommentViewer.loadPageStarHandler);
    },
    commonInnerCountHandler: function CV_commonInnerCountHandler(innerCount,
                                                                 callback) {
        // 省略黄色スターが押されたときも省略カラースターが押されたときも
        // 読込先は同じなので、共通の親に読み込み中かどうかのフラグを持たせる。
        if (innerCount.parentNode.isLoading) return;
        innerCount.parentNode.isLoading = true;
        CommentViewer.starLoader.loadAllStars(innerCount.targetURI, callback);
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


