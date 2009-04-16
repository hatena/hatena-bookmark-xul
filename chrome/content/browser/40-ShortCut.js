
const EXPORT = ['ShortCut'];

var ShortCut = {
    get keyset() {
        // return document.getElementById('hBookmark-keyset');
        // XXX: mainKeyset を override しないと、標準ショートカットを上書きできない
        return document.getElementById('mainKeyset');
    },
    get prefs() {
        if (!this._prefs) {
            let prefs = PrefService.getBranch('extensions.hatenabookmark.shortcut.');
            prefs.QueryInterface(Ci.nsIPrefBranch2);
            this._prefs = prefs;
        }
        return this._prefs;
    },
    register: function Prefs_register () {
        if (!this._observed) {
            this._observed = true;
            this.prefs.addObserver("", this, false);
        }
    },
    unregister: function Prefs_unregister () {
        this._observed = false;
        this.prefs.removeObserver("", this);
    },
    observe: function Prefs_observe (aSubject, aTopic, aData) {
        if (aTopic != "nsPref:changed") return;

        if (aData.indexOf('keys.') == 0) {
            let [_, key] = aData.split('.', 2);
            p('change shortcut key: ' + key);
            ShortCut.updateShortcut(key);
        }
    },
    getKeyName: function(key) {
        return 'hBookmark-key-' + key;
    },
    updateShortcut: function(key) {
        /*
         * XXX: keyset が、一回でも押されると変更できない
         * http://d.hatena.ne.jp/onozaty/20080204/p1 
         */
        let aID = this.getKeyName(key);
        let node = document.getElementById(aID);
        if (node)
            this.keyset.removeChild(node);

        let pref;
        try {
            // Prefs.bookmark.get('shortcut.keys.' + key) ではうまくいかない?
            pref = PrefService.getBranch('extensions.hatenabookmark.shortcut.keys.').getCharPref(key);
        } catch (ex) { p(ex); }
        let aInfo;
        if (pref) {
            aInfo = parseShortcut(pref);
        } 
        if (!aInfo) {
            p('key pref not found. :' + key);
            return;
        } else {
            p('keyinfo: ' + uneval(aInfo));
        }
        // if (!aInfo.key && !aInfo.keyCode) return;

        node = document.createElement('key');
        node.setAttribute('id', aID);
        node.setAttribute('oncommand', "hBookmark.ShortCut.commands." + key + "(event);");

        if (aInfo.key)
            node.setAttribute('key', aInfo.key);

        if (aInfo.keyCode)
            node.setAttribute('keycode', aInfo.keyCode);

        let modifiers = [];
        if (aInfo.altKey) modifiers.push('alt');
        if (aInfo.ctrlKey) modifiers.push('control');
        if (aInfo.shiftKey) modifiers.push('shift');
        if (aInfo.metaKey) modifiers.push('meta');
        modifiers = modifiers.join(',');
        if (modifiers)
            node.setAttribute('modifiers', modifiers);

        this.keyset.insertBefore(node, this.keyset.firstChild);
        p('keyset registerd:' + uneval(aInfo));
    },
    init: function() {
        this.updateShortcut('add');
        this.updateShortcut('comment');
        this.updateShortcut('sidebar');
    }
}

ShortCut.commands = {
    add: function(ev) {
        hBookmark.AddPanelManager.toggle();
        ev.stopPropagation();
        ev.preventDefault();
    },
    comment: function(ev) {
        hBookmark.CommentViewer.toggle();
        ev.stopPropagation();
        ev.preventDefault();
    },
    sidebar: function(ev) {
        document.getElementById('viewHBookmarkSidebar').doCommand();
        ev.stopPropagation();
        ev.preventDefault();
    },
}

ShortCut.keys = {
}

window.addEventListener('load', function(e) {
    ShortCut.register();
    ShortCut.init();
}, false);

window.addEventListener('unload', function(e) {
    ShortCut.unregister();
}, false);


