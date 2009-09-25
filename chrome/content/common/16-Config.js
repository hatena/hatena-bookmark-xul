
const EXPORT = ['Config'];

const PrefsBackgroundImage = 'extensions.hatenabookmark.addPanel.backgroundImage';

let Config = {
    get strings() {
        if (!Config._strings) {
            Config._strings = new Strings("chrome://hatenabookmark/locale/config.properties"); 
        } 
        return Config._strings;
    },
    openURLEditor: function() {
        let features = 'chrome,titlebar,toolbar,centerscreen,modal';
        window.openDialog('chrome://hatenabookmark/content/urlEditor.xul', 'URLEditor', features);
    },
    openDialog: function() {
        let features;
        if (Prefs.global.get('browser.preferences.instantApply')) {
            features = 'chrome,titlebar,toolbar,centerscreen,dialog=no';
        } else {
            features = 'chrome,titlebar,toolbar,centerscreen,modal';
        }
        window.openDialog('chrome://hatenabookmark/content/config.xul', 'Preferences', features);
    },
    initDataPane: function() {
        let login = document.getElementById('pref-login');
        let nologin = document.getElementById('pref-nologin');
        let loginbox = document.getElementById('pref-loginbox');
        if (User.user) {
            nologin.setAttribute('hidden', true);
            login.setAttribute('value', Config.strings.get('nowLogin', [User.user.name]));
            loginbox.removeAttribute('hidden');
        } else {
            loginbox.setAttribute('hidden', true);
            nologin.removeAttribute('hidden');
        }
    },
    syncALL: function() {
        if (Config.syncCheck()) return;
        let res = UIUtils.confirm(Config.strings.get('reSyncNotice'));
        if (res) {
            hBookmark.Model.resetAll();
            Sync.sync();
        }
    },
    sync: function() {
        if (Config.syncCheck()) return;
        Sync.sync();
    },
    deleteAll: function() {
        let res = UIUtils.confirm(Config.strings.get('deleteAllNotice'));
        if (res) {
            Config._deleteAll();
        }
    },
    _deleteAll: function() {
        User.logout(); // logout しないと、DB のコネクションが残り、SQLite ファイルが削除できない
        let pd = DirectoryService.get("ProfD", Ci.nsIFile);
        pd.append('hatenabookmark');
        if (pd.exists() && pd.isDirectory()) {
            pd.remove(true);
        }
    },
    syncCheck: function() {
        if (!User.user) {
            // むむ
            alert(Config.strings.get('loginToHatena'));
            // pref window がでてると、dialog 表示で addons window がおかしくなる
            // UIUtils.encourageLogin();
            return true;
        }
        if (Sync.nowSyncing) {
            // むむ
            alert(Config.strings.get('nowSyncing'));
            return true;
        }
        return false;
    },
    updateUI: function() {
        let file = document.getElementById(PrefsBackgroundImage).value;
        if (file) {
            let fileField = document.getElementById('addPanel.backgroundImage');
            if (fileField)
                fileField.file = file;
        }
        let migemo = document.getElementById('addPanel.xulMigemo');
        if (!XMigemoCore) {
            migemo.removeAttribute('preference');
            migemo.preference = null;
            migemo.setAttribute('checked', false);
            migemo.setAttribute('disabled', true);
        }
    },
    updateStatus: function() {
        let checked = document.getElementById('extensions.hatenabookmark.commentviewer.autoResize-check').checked;

        let w = document.getElementById('commentviewer.width');
        let h = document.getElementById('commentviewer.height');
        if (checked) {
            w.setAttribute('disabled', true);
            h.setAttribute('disabled', true);
        } else {
            w.removeAttribute('disabled');
            h.removeAttribute('disabled');
        }

        checked = document.getElementById('extensions.hatenabookmark.commentviewer.autoFilter-check').checked;
        let th = document.getElementById('commentviewer.autoFilterThreshold');
        if (checked) {
            th.removeAttribute('disabled');
        } else {
            th.setAttribute('disabled', true);
        }
    },
    browsingStatusDependencies: {
        'enabled-check': ['_targetPages-group', 'counter-check',
                          'comments-check', 'addButton-check'],
        'search-check': ['searchCount-field', 'searchCount-beforeLabel',
                         'searchCount-afterLabel', 'searchSortBy-list',
                         'searchSortBy-beforeLabel', 'searchSortBy-afterLabel'],
    },
    updateBrowsingStatus: function() {
        const ID_PREFIX = 'extensions.hatenabookmark.embed.';
        let dependencies = this.browsingStatusDependencies;
        for (let [master, slaves] in Iterator(dependencies)) {
            let disabled = !document.getElementById(ID_PREFIX + master).checked;
            slaves.forEach(function (slave) {
                document.getElementById(ID_PREFIX + slave).disabled = disabled;
            });
        }
        if (!User.user || !User.user.plususer) {
            ['search-check'].concat(dependencies['search-check']).forEach(function (key) {
                document.getElementById(ID_PREFIX + key).disabled = true;
            });
        }
    },
    addPanelPaneDependencies: {
        recommendedTagListShow: ['suggestRecommendedTags'],
        tagListShow: ['initialTagCount'],
    },
    updateAddPanelPane: function() {
        const PREFIX = 'extensions.hatenabookmark.addPanel.';
        for (let [master, slaves] in Iterator(this.addPanelPaneDependencies)) {
            let disabled = !document.getElementById(PREFIX + master).value;
            slaves.forEach(function (slave) {
                document.getElementById(PREFIX + slave).disabled = disabled;
            });
        }
    },
    clearImageFile: function() {
        let file = document.getElementById(PrefsBackgroundImage).value;
        if (file) {
            let fileField = document.getElementById('addPanel.backgroundImage');
            fileField.file = null;
            fileField.label = '';
            try {
                document.getElementById(PrefsBackgroundImage).reset();
            } catch(e) {};
        }
        // let fileField = document.getElementById('addPanel.backgroundImage');
        // fileField.file = '';
        // fileField.label = '';
    },
    selectImageFile: function() {
        let filePicker = Components.classes["@mozilla.org/filepicker;1"]
                         .createInstance(Components.interfaces.nsIFilePicker);
        filePicker.init(window, UIEncodeText("画像を選択して下さい"), filePicker.modeOpen);
        filePicker.appendFilters(Components.interfaces.nsIFilePicker.filterIamges);
        if (filePicker.show() == filePicker.returnOK) {
            document.getElementById(PrefsBackgroundImage).value = filePicker.file;
            Config.updateUI();
        }
    },
    goHelp: function(event) {
        hOpenUILink('http://b.hatena.ne.jp/help/firefox_addon_view', event);
    },
};


/*
 * base code by XUL/Migemo config.js.
 * thx Piro!
 */
Config.ShortCut = {
    prefPrefix: 'extensions.hatenabookmark.shortcut.keys.',
    KEYS: ['add', 'comment', 'sidebar'],
    keys: {},
    initPane: function() {
        var self = this;
        this.KEYS.forEach(function(key) {
            let k = document.getElementById(self.prefPrefix + key + '-input');
            k.keyData = parseShortcut(k.value);
            self.keys[key] = k;
        });
        // let add = document.getElementById('add-input');
        // add.keyData = parseShortcut(add.value);
        // this.add = add;
    },
    set: function(aNode) {
        let keyData = {};
        window.openDialog(
            'chrome://hatenabookmark/content/keyDetecter.xul',
            '_blank',
            'chrome,modal,resizable=no,titlebar=no,centerscreen',
            keyData,
            Config.strings.get('setShortcut'),
            Config.strings.get('cancel')
        );
        if (keyData.modified) {
            aNode.value = keyData.string;
            var event = document.createEvent('UIEvents');
            event.initUIEvent('input', true, false, window, 0);
            aNode.dispatchEvent(event);
        }
    },
    clear: function(aNode) {
        aNode.value = '';
        aNode.keyData = parseShortcut(aNode.value);
        aNode.keyData.modified = true;

        fireInputEvent(aNode);
    },
}

function fireInputEvent(aNode)
{
    var event = document.createEvent('UIEvents');
    event.initUIEvent('input', true, false, window, 0);
    aNode.dispatchEvent(event);
}




