const EXPORT = ["UIUtils"];

Cu.import("resource://gre/modules/PluralForm.jsm", this);

let PS = Cc["@mozilla.org/embedcomp/prompt-service;1"].
         getService(Ci.nsIPromptService);

var UIUtils = {
    popupStrings: new Strings("chrome://hatenabookmark/locale/popups.properties"),
    errorStrings: new Strings("chrome://hatenabookmark/locale/errors.properties"),
    addPanelStrings: new Strings("chrome://hatenabookmark/locale/addPanel.properties"),

    confirm: function UIU_confirm(message) {
        return PS.confirm(window, this.popupStrings.get("prompt.title"), message);
    },

    encourageLogin: function UIU_encourageLogin() {
        User.login(); // 透過的にログインできるかチェックしておく
        let win = getTopWin();
        let pressed = PS.confirmEx(
            win, this.popupStrings.get("prompt.title"),
            this.popupStrings.get("prompt.encourageLogin"),
            PS.STD_YES_NO_BUTTONS, null, null, null, null, {});
        if (pressed === 0) {
            // Open in new tab
            this.openLogin({
                ctrlKey:  true,
                shiftKey: false,
                altKey:   false,
                metaKey:  true,
                button:   0
            });
        }
    },

    selectedTextOpenHatenaWebSearch: function UIU_selectedTextOpenHatenaWebSearch(event) {
        UIUtils.openHatenaWebSearch(document.commandDispatcher.focusedWindow.getSelection().toString());
    },

    openHatenaWebSearch: function UIU_openHatenaWebSearch(text, event) {
        hOpenUILink(B_HTTP + "search?q=" + encodeURIComponent(text), event);
    },

    openLogin: function UIU_openLogin(event) {
        User.login(); // 透過的にログインできるかチェックしておく
        let redirectURL = Prefs.bookmark.get('everBookmarked')
            ? B_HTTP + '?from=firefox' : B_HTTP + 'guide/firefox_start_2';
        let loginURL = "https://www.hatena.ne.jp/login?via=1000018&location=" + encodeURIComponent(redirectURL);
        hOpenUILink(loginURL, event);
    },

    openAddBookmark: function UIU_openAddBookmark(event) {
        hOpenUILink(B_HTTP + User.user.name + "/add", event);
    },

    _guideURLs: [
        B_HTTP + 'guide/firefox_start_1',
        B_HTTP + 'guide/firefox_start_2',
        B_HTTP + 'guide/firefox_start_3',
        B_HTTP + 'guide/firefox_start_main',
    ],

    openWhatsHatenaBookmark: function UIU_openWhatsHatenaBookmark(event) {
        event = event || { ctrlKey: true, metaKey: true };
        hOpenUILink('http://b.hatena.ne.jp/guide?via=200041', event);
    },

    openHatenaGuide: function UIU_openHatenaGuide(event) {
        UIUtils.openGuidePage(UIUtils._guideURLs[0], event);
    },

    openBookmarkGuide: function UIU_openBookmarkGuide(event) {
        UIUtils.openGuidePage(UIUtils._guideURLs[1], event);
    },

    openDoneBookmarkGuide: function UIU_openDoneBookmarkGuide(event) {
        UIUtils.openGuidePage(UIUtils._guideURLs[2], event);
    },

    openStartupGuide: function UIU_openStartupGuide(event) {
        UIUtils.openGuidePage(UIUtils._guideURLs[3], event);
    },

    openGuidePage: function UIU_openGuidePage(url, event) {
        let urls = UIUtils._guideURLs;
        for (let tab = gBrowser.tabContainer.firstChild;
             tab;
             tab = tab.nextSibling) {
            // XXX 起動直後は currentURI が about:blank になっているので、
            // 既にガイドページを開いていても新たなタブで開いてしまう。
            let currentURL = tab.linkedBrowser.currentURI.spec;
            if (urls.indexOf(currentURL) !== -1) {
                if (url !== currentURL)
                    tab.linkedBrowser.loadURI(url);
                gBrowser.selectedTab = tab;
                return;
            }
        }

        event = event || { ctrlKey: true, metaKey: true };
        hOpenUILink(url, event);
    },

    confirmDeleteBookmarks: function UIU_confirmDeleteBookmarks(bookmarks) {
        let title = this.popupStrings.get("prompt.title");
        let message = this.popupStrings.get("prompt.confirmDeleteBookmarks",
                                            [bookmarks.length])
        return PS.confirm(window.top, title, message);
    },

    alertBookmarkError: function UIU_alertBookmarkError(operation, bookmarks) {
        let alertTitle = this.popupStrings.get("prompt.title");
        let message = "";
        switch (operation) {
        case 'delete':
            let titles = [].concat(bookmarks).map(function (b) b.title);
            const MAX_BOOKMARK_DISPLAY_COUNT = 10;
            if (titles.length > MAX_BOOKMARK_DISPLAY_COUNT) {
                titles.length = MAX_BOOKMARK_DISPLAY_COUNT;
                titles.push(Prefs.global.getLocalized("intl.ellipsis"));
            }
            message = this.errorStrings.get('failToDeleteBookmarks') +
                      "\n\n" + titles.join("\n");
            break;
        }
        PS.alert(window.top, alertTitle, message);
    },

    createDeleteErrorHandler: function (bookmarks) {
        bookmarks = [].concat(bookmarks);
        var self = this;
        return function () {
            self.alertBookmarkError('delete', bookmarks);
        };
    },

    openLinks: function UIU_openLinks(uris, event) {
        if (!this.confirmOpenInTabs(uris.length)) return;
        this.forceOpenLinks(uris, event);
    },

    confirmOpenInTabs: function UIU_confirmOpenInTabs(openCount) {
        const WARN_ON_OPEN = "browser.tabs.warnOnOpen";
        const MAX_OPEN_BEFORE_WARN = "browser.tabs.maxOpenBeforeWarn";

        let reallyOpen = true;
        if (Prefs.global.get(WARN_ON_OPEN) &&
            openCount >= Prefs.global.get(MAX_OPEN_BEFORE_WARN)) {
            let warnOnOpen = { value: true };
            let brandStrings =
                new Strings("chrome://branding/locale/brand.properties");
            let brandShortName = brandStrings.get("brandShortName");
            let placesStrings =
                new Strings("chrome://browser/locale/places/places.properties");

            let buttonPressed = PS.confirmEx(
                window, placesStrings.get("tabs.openWarningTitle"),
                placesStrings.get("tabs.openWarningMultipleBranded",
                                  [openCount, brandShortName]),
                PS.BUTTON_TITLE_IS_STRING * PS.BUTTON_POS_0 +
                    PS.BUTTON_TITLE_CANCEL * PS.BUTTON_POS_1,
                placesStrings.get("tabs.openButtonMultiple"), null, null,
                placesStrings.get("tabs.openWarningPromptMeBranded",
                                  [brandShortName]),
                warnOnOpen);
            reallyOpen = (buttonPressed === 0);
            if (reallyOpen && !warnOnOpen.value)
                Prefs.global.set(WARN_ON_OPEN, false);
        }
        return reallyOpen;
    },

    forceOpenLinks: function UIU_forceOpenLinks(uris, event) {
        let win = getTopWin();
        if (Prefs.link.get("openInNewTab")) {
            event = event || { ctrlKey: false, metaKey: false };
            event = { ctrlKey: !event.ctrlKey, metaKey: !event.metaKey, __proto__: event };
        }
        let where = whereToOpenLink(event, false, true);
        if (!win || where === "window") {
            window.openDialog(getBrowserURL(), "_blank",
                              "chrome,all,dialog=no", uris.join("|"));
            return;
        }
        let loadInBackground = (where === "tabshifted");
        let replaceCurrentTab = (where !== "tab");
        win.getBrowser().loadTabs(uris, loadInBackground, replaceCurrentTab);
    },

    isSafeLink: function UIU_isSafeLink(uri) {
        return /^(?:https?|ftp):\/\//.test(uri);
    },

    getBookmarkElement: function UIU_getBookmarkElement(element) {
        while (element && !("bookmark" in element ||
                            "bookmarks" in element ||
                            "hoveredBookmark" in element))
            element = element.parentNode;
        return element;
    },

    onBookmarkCommand: function UIU_onBookmarkCommand(event) {
        let bookmark = event.originalTarget.bookmark;
        if (!bookmark) return;
        hOpenUILink(bookmark.url, event);
        event.stopPropagation();
    },

    onBookmarkClick: function UIU_onBookmarkClick(event) {
        if (event.button !== 1) return;
        this.onBookmarkCommand(event);
        closeMenus(event.originalTarget);
    },

    getUsersText: function UIU_getUsersText(count) {
        let ruleNum = +this.addPanelStrings.get("usersPluralRuleNum");
        let get = PluralForm.makeGetter(ruleNum)[0];
        let text = get(count, this.addPanelStrings.get("usersLabel"));
        return text.replace(/#1/g, count);
        return count + " users";
    },

    deleteContents: function UIU_deleteContents(element) {
        let range = document.createRange();
        range.selectNodeContents(element);
        range.deleteContents();
    },

    isVisible: function UIU_isVisible(element) {
        for (; element; element = element.parentNode)
            if (element.collapsed || element.hidden)
                return false;
        return true;
    },

    crop: function UIU_crop(str, size, suffix) {
        size = size || 32;
        suffix = suffix || Prefs.global.getLocalized("intl.ellipsis");
        let b = 0;
        for (let i = 0; i < str.length; i++) {
            b += (str.charCodeAt(i) < 0x100) ? 1 : 2;
            if (b > size)
                return str.substring(0, i) + suffix;
        }
        return str;
    },

    cropURL: function UIU_cropURL(url, size) {
        size = size || 40;
        url = url.replace(/^https?:\/\//, "").replace(/\.[^\/]+$/, "");
        return UIUtils.crop(url, size);
    },
};
