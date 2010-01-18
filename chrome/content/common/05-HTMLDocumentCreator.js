const EXPORT = ['HTMLDocumentCreator'];

const NS_HTMLDOCUMENT_CID = '{5d0fcdd0-4daa-11d2-b328-00805f8a3859}';

let HDC = {
    fromString: function HDC_fromString(source) {
        let doc = Components.classesByID[NS_HTMLDOCUMENT_CID].createInstance();
        doc.appendChild(doc.createElement('html'));
        let range = doc.createRange();
        range.selectNodeContents(doc.documentElement);
        let fragment = range.createContextualFragment(source);
        if (Array.some(fragment.childNodes, function (child)
                       child instanceof Ci.nsIDOMHTMLBodyElement)) {
            doc.documentElement.appendChild(fragment);
        } else {
            // createContextualFragment で作った文書片には
            // head 要素と body 要素が欠けているので、自分で作ってやる
            let head = doc.createElement('head');
            let headChildNames = {
                title: true, meta: true, link: true, script: true, style: true,
                object: true, base: true, isindex: true,
            };
            let child;
            while ((child = fragment.firstChild)) {
                if ((child.nodeType === Node.ELEMENT_NODE &&
                     !(child.nodeName.toLowerCase() in headChildNames)) ||
                    (child.nodeType === Node.TEXT_NODE &&
                     /\S/.test(child.nodeValue)))
                    break;
                head.appendChild(child);
            }
            let body = doc.createElement('body');
            body.appendChild(fragment);
            doc.documentElement.appendChild(head);
            doc.documentElement.appendChild(body);
        }
        if (!doc.title) {
            // Firefox 3 では HTMLDocument.title が自動的に
            // 設定されないようなので、手動で設定する
            let title = doc.getElementsByTagName('title').item(0);
            if (title)
                doc.title = title.textContent;
        }
        return doc;
    },

    fromURL: function HDC_fromURL(url, callback) {
        HDC.fromURLWithEncoding(url, null, callback);
    },

    fromURLWithEncoding: function HDC_fromURLWithEncoding(url, encoding, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        if (encoding)
            xhr.overrideMimeType('text/html; charset=' + encoding);
        xhr.addEventListener('load', onEvent, false);
        xhr.addEventListener('error', onEvent, false);
        xhr.send(null);

        function onEvent(event) {
            xhr.removeEventListener('load', onEvent, false);
            xhr.removeEventListener('error', onEvent, false);

            let contentType = xhr.getResponseHeader('Content-Type') || '';
            contentType = contentType.replace(/;.*/, '');
            if (event.type !== 'load' || !xhr.responseText ||
                !/\bx?html\b/i.test(contentType)) {
                callback(null);
                return;
            }

            let text = xhr.responseText;
            if (!encoding && text.substring(0, 10 * 1024).split('\ufffd').length > 3) {
                // 文字符号化方式が自動判別で、先頭 10KB 以内に Unicode
                // 置換文字が 3 つ以上現れるなら、文字化けしているとみなす
                // (少数なら偶然紛れ込んだのかもしれない)
                let match = text.substring(0, 2048).match(/\bcharset\s*=\s*([\w-]+)/i);
                if (match) {
                    p('Mojibake ocurred, and we assume that the correct encoding is ' + match[1]);
                    HDC.fromURLWithEncoding(url, match[1], callback);
                    return;
                }
            }
            callback(HDC.fromString(text));
        }
    },
};

var HTMLDocumentCreator = HDC;
