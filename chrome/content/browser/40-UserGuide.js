const EXPORT = ['UserGuide'];

var UserGuide = {
    start: function UG_start(allowRestart) {
        let firstRun = shared.has('firstRun');
        let loggedIn = !!User.user;
        let everLoggedIn = Prefs.bookmark.get('everLoggedIn');
        let everBookmarked = Prefs.bookmark.get('everBookmarked');

        if (allowRestart && everLoggedIn && !loggedIn) {
            UserGuide.tryRestart();
            return;
        }
        p('start user guide');

        if (!everLoggedIn) {
            UIUtils.openHatenaGuide();
            UserGuide.watchFirstBookmark();
        } else if (!everBookmarked) {
            UIUtils.openBookmarkGuide();
            UserGuide.watchFirstBookmark();
        } else if (firstRun) {
            UIUtils.openStartupGuide();
        }
    },

    tryRestart: function UG_tryRestart() {
        p('try to restart user guide');
        function restart() {
            if (!restart) return;
            listener.unlisten();
            restart = listener = null;
            UserGuide.start(false);
        }
        let listener = EventService.createListener('UserChange', restart);
        setTimeout(restart, 3000);
    },

    watchFirstBookmark: function UG_watchFirstBookmark() {
        Prefs.bookmark.createListener('everBookmarked', UserGuide.onFirstBookmark);
    },

    onFirstBookmark: function UG_onFirstBookmark() {
        if (!Prefs.bookmark.get('everBookmarked')) return;
        if (shared.has('alreadyBookmarked'))
            UIUtils.openStartupGuide();
        else
            UIUtils.openDoneBookmarkGuide();
    },
};

EventService.createListener('firstPreload', function () {
    setTimeout(function () UserGuide.start(true), 200);
});
