
/*
 * yattuke shigoto.js
 * 酷いコードですね
 */

const B_URL = 'http://b.hatena.ne.jp/';
const CMD_EVENT_NAME = 'hBookmark-view-comments';
const SHOW_PREFS_NAME = 'extensions.hatenabookmark.commentviwer.allShow';
/*
 * comment.html から、外部 html リンクが開けてしまうと、セキュリティ的にまずいので注意
 */

window.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    let link;
    let t = e.target;
    if (t.id == 'close-button-img') 
        return close();
    if (t.id == 'toggle-button-img') 
        return toggle();
    if (t.tagName == 'A') {
        link = t.href;
    } else if (t.tagName == 'IMG') {
        if (t.parentNode.tagName == 'A') {
            link = t.parentNode.href;
        }
    }
    // openUILink(link, e);
    if (link) {
        openUILinkIn(link, 'tab');
        close();
    }
}, false);

window.addEventListener('DOMContentLoaded', function() {
    setCommentView();
}, false);

var toggle = function() {
    Application.prefs.get(SHOW_PREFS_NAME).value = !Application.prefs.get(SHOW_PREFS_NAME).value;
    setCommentView();
    posCalc();
}

var posCalc = function() {
    // let rect = document.body.getBoundingClientRect();
    let rect = $('list').getBoundingClientRect();
    let height = parseInt(rect.bottom) - parseInt(rect.top) + 100; // うーん
    p('height: ' + height);
    window.scrollTo(0, 0);
    throwEvent('rendered', {
        height: parseInt(height),
    });
}

var setCommentView = function() {
    let src;
    if (Application.prefs.get(SHOW_PREFS_NAME).value) {
         src = "chrome://hatenabookmark/skin/images/comment-viewer-toggle-on.png";
         $('list').className = '';
    } else {
         src = "chrome://hatenabookmark/skin/images/comment-viewer-toggle-off.png";
         $('list').className = 'nocommentall';
    }
    $('toggle-button-img').src = src;
}

let lastEID = null;

var dispatchMethods = {
    'load-json': function(data) {
        if (!data) {
            clear();
            return;
        } else {
            // 同じ eid なら描画し直さない
            if (data.eid == lastEID) {
                return;
            } else {
                lastEID = data.eid;
                clear();
            }
        }
        $('favicon').src = data.favicon;
        $('title').appendChild(T(data.title));
        let cEL = $('count');
        setCommentView();

        if (data.count) {
            let c = data.count;
            cEL.innerHTML = '' + c + ' user' + ((c > 1) ? 's' : '');
            cEL.className = 'users';
            cEL.href = data.entry_url;
        } else {
            cEL.href = '';
            cEL.className = '';
        }
        p.b(function() {
            if (data.bookmarks && data.bookmarks.length) {
                data.bookmarks.forEach(function(b) {
                    let li = E('li');
                    let userlink = B_URL + b.user + '/';
                    let ymd = b.timestamp.split(' ')[0];
                    let permalink = userlink + ymd.replace(/\//g, '') + '#' + data.eid;
                    let icon = userIcon(b.user);
                    li.appendChild(E('a', {href: permalink, className: 'user-permalink'}, icon));
                    li.appendChild(E('a', {href: permalink, className: 'username'}, b.user));
                    if (b.tags) b.tags.forEach(function(tag, index) {
                        let userlinkTag = userlink + '/t/' + encodeURIComponent(tag);
                        if (index) li.appendChild(T(', '));
                        li.appendChild(E('a', {href: userlinkTag, className:'tag'}, tag));
                    });
                    li.appendChild(E('span', {className: 'comment'}, b.comment));
                    li.appendChild(E('span', {className: 'timestamp'}, ymd));
                    if (!b.comment) {
                        li.className = 'nocomment';
                    }
                    $('list').appendChild(li);
                });
            } else {
                let li = E('li', {}, '表示できるブックマークコメントはありません。');
                $('list').appendChild(li);
            }
        }, 'comment rendered');

        /*
         * 即座に取得すると高さ0が返るので…
         */
        setTimeout(posCalc, 10);
    }
};


document.commandDispatcher = top.document.commandDispatcher;
top.addEventListener(CMD_EVENT_NAME, function(ev) {
    if (typeof dispatchMethods == 'undefined') return; // XXX: why?
    let m = dispatchMethods[ev.getData('method')];
    if (m) m(ev.getData('data'));
}, false);

let throwEvent = function(method, data) {
     let ev = top.document.createEvent('DataContainerEvent');
     ev.initEvent(CMD_EVENT_NAME, false, false);
     ev.setData('method', method);
     ev.setData('data', data);
     top.dispatchEvent(ev);
}

let E = function(name, attr) {
    var children = Array.slice(arguments, 2);
    var e = document.createElement(name);
    if (attr) for (let key in attr) e[key] = attr[key];//e.setAttribute(key, attr[key]);
    children.map(function(el) el.nodeType > 0 ? el : document.createTextNode(el)).
        forEach(function(el) e.appendChild(el));
    return e;
}

let close = function() {
    throwEvent('close');
}

let userIcon = function(username) {
    return E('img', {
        src: 'https://www.hatena.ne.jp/users/' + username.substring(0, 2) + '/' + username + '/profile_s.gif',
        className: 'usericon',
        alt: username,
    });
}


let p = function(el) {
    top.hBookmark.p(el);
}

p.b = function(func, name) {
    name = 'Benchmark ' + (name || '') + ': ';
    let now = new Date * 1;
    func();
    let t = (new Date * 1) - now;
    p(name + t);
    return t;
}

let T = function(text) {
    return document.createTextNode(text);
}

let $ = function(name) {
    return document.getElementById(name);
}

let removeAll = function(el) {
    while (el.firstChild) el.removeChild(el.firstChild); 
}

let clear = function() {
    removeAll($('title'));
    removeAll($('count'));
    removeAll($('list'));
}


