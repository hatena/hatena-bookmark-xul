
var EXPORT = ['Migration'];
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
    },
    function M_2_openStartPage() {
        // スタートページの表示は UserGuide でやるんで、
        // 初回インストール時は初回インストールだということを記憶するだけ。
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
