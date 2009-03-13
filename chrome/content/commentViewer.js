
document.commandDispatcher = top.document.commandDispatcher;
top.addEventListener('hBookmark-view-comments', function(ev) {
    removeAll(I('title'));
    removeAll(I('count'));
    removeAll(I('list'));
    // alert(ev.getData('data'));
}, false);

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

let p = function(el) {
    top.Application.console.log('' + el);
}

let I = function(name) {
    return document.getElementById(name);
}

let removeAll = function(el) {
    while (el.firstChild) el.removeChild(el.firstChild); 
}

