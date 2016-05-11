var EXPORT = ['urlEditor'];

elementGetter(this, 'addInput', 'hBookmark-urlEditor-add-input', document);
elementGetter(this, 'listbox', 'hBookmark-urlEditor-listbox', document);

var urlEditor = {
    get strings() {
        if (!Config._strings) {
            Config._strings = new Strings("chrome://hatenabookmark/locale/urlEditor.properties");
        }
        return Config._strings;
    },
    init: function() {
    },
    add: function() {
        let url = addInput.value;
        url = url.replace(/\s+/g, '');
        if (!url.length) return;

        try {
            new RegExp(url);
        } catch(e) {
            return alert(urlEditor.strings.get('regexError') + "\n" + url);
        }
        addInput.value = '';
        listbox.appendItem(url, url);
    },
    remove: function() {
        let i = listbox.selectedIndex;
        if (i >= 0)
            listbox.removeItemAt(i);
    },
    accept: function() {
        let res = [];
        for (var i = 0;  i < listbox.getRowCount(); i++) {
            let item = listbox.getItemAtIndex(i);
            res.push(item.value);
        }
        PrefService.setCharPref('extensions.hatenabookmark.statusbar.counterIgnoreList', uneval(res));
    },
    reset: function() {
        if (window.confirm(urlEditor.strings.get('defaultConfirm'))) {
            let defaults = PrefService.getDefaultBranch(null).getCharPref('extensions.hatenabookmark.statusbar.counterIgnoreList');
            PrefService.setCharPref('extensions.hatenabookmark.statusbar.counterIgnoreList', defaults);
            urlEditor.init();
        }
    },
    init: function() {
        let list;
        try {
            list = eval(PrefService.getCharPref('extensions.hatenabookmark.statusbar.counterIgnoreList'));
        } catch (e) {
            let defaults = PrefService.getDefaultBranch(null).getCharPref('extensions.hatenabookmark.statusbar.counterIgnoreList');
            PrefService.setCharPref('extensions.hatenabookmark.statusbar.counterIgnoreList', defaults);
            list = eval(PrefService.getCharPref('extensions.hatenabookmark.statusbar.counterIgnoreList'));
        }
        while(listbox.getRowCount()) listbox.removeItemAt(0);
        list.forEach(function(v) listbox.appendItem(v, v));
    },
};
