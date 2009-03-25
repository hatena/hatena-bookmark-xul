
const EXPORT = ['Config'];
const PrefsBackgroundImage = 'extensions.hatenabookmark.addPanel.backgroundImage';

let Config = {
    syncALL: function() {
        if (Config.syncCheck()) return;
        let res = window.confirm(UIEncodeText('すべて同期し直すにはしばらく時間がかかります。よろしいですか？'));
        if (res) {
            hBookmark.Model.resetAll();
            Sync.sync();
        }
    },
    sync: function() {
        if (Config.syncCheck()) return;
        Sync.sync();
    },
    syncCheck: function() {
        if (!User.user) {
            // むむ
            alert(UIEncodeText('この操作には、はてなへのログインが必要です'));
            // UIUtils.encourageLogin();
            return true;
        }
        if (Sync.nowSyncing) {
            // むむ
            alert(UIEncodeText('現在同期中です'));
            return true;
        }
        return false;
    },
    updateUI: function() {
        let file = document.getElementById(PrefsBackgroundImage).value;
        if (file) {
            let fileField = document.getElementById('addPanel.backgroundImage');
            fileField.file = file;
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
    }
};

