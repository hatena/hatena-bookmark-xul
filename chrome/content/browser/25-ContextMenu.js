
const EXPORT = ['ContextMenu'];

elementGetter(this, 'addentry', 'hBookmark-menu-addentry', document);
elementGetter(this, 'addlink', 'hBookmark-menu-addlink', document);

var ContextMenu = {
    registerEventListeners: function() {
        let contextMenu = document.getElementById("contentAreaContextMenu");
        contextMenu.addEventListener('popupshowing', ContextMenu.contextMenuHandler, false);
    },
    unregisterEventListeners: function() {
        // contextMenu.removeEventListenr('popupshowing', ContextMenu.contextMenuHandler, false);
    },
    contextMenuHandler: function(ev) {
        if (gContextMenu.onTextInput || gContextMenu.onMailtoLink || gContextMenu.onMathML || gContextMenu.isTextSelected) {
            addentry.setAttribute('hidden', true);
            addlink.setAttribute('hidden', true);
            return;
        }
        if (gContextMenu.onLink) {
            addentry.setAttribute('hidden', true);
            addlink.removeAttribute('hidden');
        } else {
            addentry.removeAttribute('hidden');
            addlink.setAttribute('hidden', true);
        }
    },
}

window.addEventListener('load', ContextMenu.registerEventListeners, false)
window.addEventListener('unload', ContextMenu.unregisterEventListeners, false);
