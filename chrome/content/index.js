var loadHandler;
with(hBookmark) { // XXX
    let BOOKMARK = model('Bookmark');

    let E = function(name, attr) {
        var children = Array.slice(arguments, 2);
        var e = document.createElement(name);
        if (attr) for (let key in attr) e[key] = attr[key];//e.setAttribute(key, attr[key]);
        children.map(function(el) el.nodeType > 0 ? el : document.createTextNode(el)).
            forEach(function(el) e.appendChild(el));
        return e;
    }
    E.t = function(text) {
        return document.createTextNode(text);
    }

    // code by id:piro_or
    let xmlToDom = function xmlToDom(xml, xmlns) {
        var doc = (new DOMParser).parseFromString(
          '<root xmlns="' + xmlns + '">' + xml.toXMLString() + "</root>",
          "application/xml");
        var imported = document.importNode(doc.documentElement, true);
        var range = document.createRange();
        range.selectNodeContents(imported);
        var fragment = range.extractContents();
        range.detach();
        return fragment.childNodes.length > 1 ? fragment : fragment.firstChild; 
    }

    let H = function(xml) xmlToDom(xml, 'http://www.w3.org/1999/xhtml');

    let createBookmarkList = function(bookmark) {
        let favImgClassName = "favicon-image";
        let favImgSubClassName = "favicon-image-sub";
        let html = E('li', {className: 'bookmark'});
        var h3Elem = html.appendChild(
           html.head = E('h3', {className: 'entry-search'},
               E("span", { className: favImgSubClassName }), // favicon 画像の代わり
               html.link = E('a', { target: '_blank' }, bookmark.title))
        );
        hBookmark.getFaviconImageUriAsync(bookmark.url, function (faviconUriStr) {
            if (faviconUriStr !== "") {
                var favSubElem = h3Elem.querySelector("span." + favImgSubClassName);
                var favImgElem = E("img", { className: favImgClassName, src: faviconUriStr });
                h3Elem.insertBefore(favImgElem, favSubElem);
                h3Elem.removeChild(favSubElem);
            }
        });
        html.appendChild(
           html.commentDiv = E('div', {className: 'comment'}, 
             html.tags      = E('span', {className: 'tags'}, bookmark.tags.join(', ')), ' ',
             html.comment   = E('span', {className: 'comment'}, bookmark.body)
           )
        );
        html.appendChild(
           html.urlDiv = E('div', {className: 'infos'}, 
             html.url = E('a', {className: 'url'}, bookmark.url), ' ',
             // html.timestamp = E('span', {className: 'timestamp'}, bookmark.date.toString().substring(0,8)),
             ' ', E('a', {href: bookmark.entryURL}, E('img', {src: bookmark.imageURL, height:'13'}))
           )
        );
        html.url.href = html.link.href = bookmark.url;
        return html;
    };

    let createDateH2 = function(date) {
        let d = date.toString();
        date =[d.substr(0,4), d.substr(4,2), d.substr(6,2)]
        let h2 = E('h2', {className: 'date'}, date.join('-'));
        return h2;
    }

    loadHandler = function() {
        if (!User.user) {
            // XXX
            User.login();
        }

        let bookmarkedContainer = document.getElementById('bookmarked-list-container');

        let lastDate = '';
        let bookmarked;
        p.b(function(){
        BOOKMARK.find({
            order: 'date desc',
            limit: 100,
        }).forEach(function(bookmark) {
            if (!bookmarked || lastDate != bookmark.date.toString().substr(0, 8)) {
                bookmarked = E('ul', {className: 'bookmarked-list'});
                lastDate = bookmark.date.toString().substr(0, 8);
                bookmarkedContainer.appendChild(createDateH2(bookmark.date));
                bookmarkedContainer.appendChild(bookmarked);
            }
            bookmarked.appendChild(createBookmarkList(bookmark));
        });
        }, '1st');

        let searchbox = document.getElementById('searchbox');
        let searchContainer = document.getElementById('bookmarked-search-container');
        searchbox.addEventListener('keyup', function(e) {
            let word = searchbox.value;
            if (word.length >= 2) {
        p.b(function(){
                searchContainer.style.display = 'block';
                searchContainer.innerHTML = '<h2>検索結果</h2>';
                bookmarkedContainer.style.display = 'none';

                bookmarked = null;
                BOOKMARK.search(word, 10).forEach(function(bookmark) {
                    if (!bookmarked || lastDate != bookmark.date.toString().substr(0, 8)) {
                        bookmarked = E('ul', {className: 'bookmarked-list'});
                        lastDate = bookmark.date.toString().substr(0, 8);
                        searchContainer.appendChild(createDateH2(bookmark.date));
                        searchContainer.appendChild(bookmarked);
                    }
                    bookmarked.appendChild(createBookmarkList(bookmark));
                });
        }, 'search: ' + word);
            } else {
                searchContainer.style.display = 'none';
                bookmarkedContainer.style.display = 'block';
            }
        }, false);
    }
}

window.addEventListener('load', loadHandler, false);

