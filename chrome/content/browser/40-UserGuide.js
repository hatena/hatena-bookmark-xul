const EXPORT = ['UserGuide'];

var UserGuide = {
    firstTry: true,

    start: function UG_start() {
        let firstTry = UserGuide.firstTry;
        UserGuide.firstTry = false;
        let firstRun = shared.has('firstRun');
        let loggedIn = !!User.user;
        let everLoggedIn = Prefs.bookmark.get('everLoggedIn');
        let everBookmarked = Prefs.bookmark.get('everBookmarked');

        if (firstTry && firstRun && everLoggedIn && !loggedIn) {
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
            UserGuide.start();
        }
        let listener = EventService.createListener('UserChange', restart);
        setTimeout(restart, 3000);
    },

    watchFirstBookmark: function UG_watchFirstBookmark() {
        Prefs.bookmark.createListener('everBookmarked', UserGuide.onFirstBookmark);
    },

    onFirstBookmark: function UG_onFirstBookmark() {
        if (!Prefs.bookmark.get('everBookmarked')) return;
        UIUtils.openDoneBookmarkGuide();
    },
};

EventService.createListener('firstPreload', function () {
    setTimeout(UserGuide.start, 200);
});
