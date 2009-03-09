var loadHandler;
with(hBookmark) { // XXX
    let BOOKMARK = model('Bookmark');
    let E = function(name, attr) {
        var children = Array.slice(arguments, 2);
        var e = document.createElement(name);
        if (attr) for (let key in attr) e.setAttribute(key, attr[key]);
        children.map(function(el) el.nodeType > 0 ? el : document.createTextNode(el)).
            forEach(function(el) e.appendChild(el));
        return e;
    }

    loadHandler = function() {
        if (!User.user) {
            // XXX
            User.login();
        }

        var bookmarked = document.getElementById('bookmarked-list');

        p.b(function() {
        BOOKMARK.find({
            order: 'date desc',
            limit: 10,
        }).forEach(function(bookmark) {
            var li = E('li', {}, 
                E('img', {src: bookmark.favicon}),
                bookmark.title
            );
            bookmarked.appendChild(li);
        });
        }, 'foo');

        p.b(function() {
        BOOKMARK.search('cssva').forEach(function(bookmark) {
            var li = E('li', {}, 
                E('img', {src: bookmark.favicon}),
                bookmark.title
            );
            bookmarked.appendChild(li);
        });
        }, 'foo');
    }
}

window.addEventListener('load', loadHandler, false);
