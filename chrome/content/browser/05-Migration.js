
const EXPORT = ['Migration'];
/*
 * バージョンによってのコンフィグの差異を変更する
 */

var Migration = {
    // 現在の conf のバージョン
    CURRENT_VERSION: 3,

    migration: function() {
        let currentVer = Prefs.bookmark.get('migration.version') || 0;
        let migrations = Migration.Migrations;
        for (let i = 0,len = migrations.length;  i < len; i++) {
            if (currentVer < i+1) {
                let m = migrations[i];
                p('execute migration: ' + m.name);
                m();
                Prefs.bookmark.set('migration.version', i + 1);
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
    function M_2_openStartPage() {
        // // 初回インストール時に、start ページを表示する
        // let listener;
        // listener = EventService.createListener('load', function() {
        //     setTimeout(function() {
        //         p('open start page');
        //         openUILinkIn('http://b.hatena.ne.jp/guide/firefox_start', 'tab');
        //         listener.unlisten();
        //     }, 1000);
        // });

        // スタートページの表示は UserGuide でやるんで、
        // 今は初回インストールだということを記憶するだけ。
        shared.set('firstRun', true);
    },
    function M_3_renamePrefs() {
        const PREFIX = 'extensions.hatenabookmark.';
        const OLD_IGNORE = PREFIX + 'statusbar.counterIngoreList';
        const NEW_IGNORE = PREFIX + 'statusbar.counterIgnoreList';
        const OLD_CAPTURE = PREFIX + 'link.linkOverlay';
        const NEW_CAPTURE = PREFIX + 'link.captureAddition';
        const CAPTURE_COMMENTS = PREFIX + 'link.captureComments';

        if (PrefService.prefHasUserValue(OLD_IGNORE)) {
            let value = PrefService.getCharPref(OLD_IGNORE);
            PrefService.setCharPref(NEW_IGNORE, value);
            PrefService.clearUserPref(OLD_IGNORE);
        }
        if (PrefService.prefHasUserValue(OLD_CAPTURE)) {
            let value = PrefService.getBoolPref(OLD_CAPTURE);
            PrefService.setBoolPref(NEW_CAPTURE, value);
            PrefService.setBoolPref(CAPTURE_COMMENTS, value);
            PrefService.clearUserPref(OLD_CAPTURE);
        }
    },
];

