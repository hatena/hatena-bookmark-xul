
const EXPORT = ['Migration'];
/*
 * バージョンによってのコンフィグの差異を変更する
 */

var Migration = {
    // 現在の conf のバージョン
    CURRENT_VERSION: 1,

    migration: function() {
        let currentVer = Application.prefs.get('extensions.hatenabookmark.migration.version').value || 0;
        let migrations = Migration.Migrations;
        for (let i = 0,len = migrations.length;  i < len; i++) {
            if (currentVer < i+1) {
                let m = migrations[i];
                p('execute migration: ' + m.name);
                m();
                Application.prefs.get('extensions.hatenabookmark.migration.version').value = (i + 1);
            }
        }
    },
}

EventService.createListener('Migration', function() {
    Migration.migration();
});

Migration.Migrations = [
    // デバッグログに、Migration の無名関数の名前を表示するので、つけておく
    function M_1_toolbarMenuInstall() {
        // やっぱり標準ではインストールしない
        return;
        var toolbar = document.getElementById('nav-bar');
        try {
            // Fx 3.0 unified-back-forward-button,reload-button,stop-button,home-button,
            // hBookmark-toolbar-home,quickrestart-button,urlbar-container,search-container
            let bars = toolbar.currentSet.split(',');
            bars = bars.filter(function(n) n.indexOf('hBookmark-toolbar-' == -1));

            let lastButton = null;
            let flag = false;
            let newSet = [];

            for (let i = 0;  i < bars.length; i++) {
                let name = bars[i];
                let el = document.getElementById(name);
                if (flag) {
                    //
                } else if (el && name.indexOf('-button') >= 0 ) {
                    lastButton = el;
                } else if (lastButton) {
                    // -button という ID が無くなった直後に追加
                    newSet.push('hBookmark-toolbar-add-button');
                    newSet.push('hBookmark-toolbar-home-button');
                    // newSet.push('hBookmark-toolbar-dropdown');
                    flag = true;
                }
                newSet.push(name);
            }
            if (flag) {
                newSet = newSet.join(',');
                toolbar.currentSet = newSet;
                toolbar.setAttribute('currentset', newSet);
                document.getElementById('navigator-toolbox').ownerDocument.persist(toolbar.id, 'currentset');
                BrowserToolboxCustomizeDone(true);
            }
        } catch(e) {
            p('install fail!: ' + e.toString());
        }
    },
];

