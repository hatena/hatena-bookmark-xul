
const EXPORT = ['Config'];

var Config = {
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
};

