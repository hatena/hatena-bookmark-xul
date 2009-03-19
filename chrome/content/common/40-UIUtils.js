const EXPORT = ["UIUtils"];

let PS = Cc["@mozilla.org/embedcomp/prompt-service;1"].
         getService(Ci.nsIPromptService);

var UIUtils = {
    popupStrings: new Strings("chrome://hatenabookmark/locale/popups.properties"),

    confirmDeleteBookmarks: function UIU_confirmDeleteBookmarks(bookmarks) {
        let title = this.popupStrings.get("prompt.title");
        let message = this.popupStrings.get("prompt.confirmDeleteBookmarks",
                                            [bookmarks.length])
        return PS.confirm(window.top, title, message);
    }
};
