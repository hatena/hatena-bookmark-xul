const EXPORT = ["UIUtils"];

let PS = Cc["@mozilla.org/embedcomp/prompt-service;1"].
         getService(Ci.nsIPromptService);

var UIUtils = {
    popupStrings: new Strings("chrome://hatenabookmark/locale/popups.properties"),

    confirmDeleteAllBookmarks: function UIU_confirmDelAllBm(bookmarks) {
        let title = this.popupStrings.get("prompt.title");
        let message = this.popupStrings.get("prompt.confirmDeleteAllBookmarks",
                                            [bookmarks.length])
        return PS.confirm(window.top, title, message);
    }
};
