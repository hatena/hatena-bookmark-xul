
function setShortcutKey() {
    let win = getTopWin();
    let key = win.document.getElementById("hBookmark-key-comment");
    if (!key) return;
    key = document.importNode(key, false);
    let command = key.getAttribute("oncommand");
    command = command.replace(/\bhBookmark\b/g, "getTopWin().hBookmark");
    key.setAttribute("oncommand", command);
    let keyset = document.createElementNS(hBookmark.XUL_NS, "keyset");
    keyset.appendChild(key);
    document.documentElement.appendChild(keyset);
}

window.addEventListener("load", setShortcutKey, false);
