const EXPORT = ["AddDialogManager"];

var AddDialogManager = {
    entries: [],

    toggleDialogFor: function ADM_toggleDialogFor(window) {
        for (let i = 0; i < this.entries.length; i++) {
            if (this.entries[i].window === window) {
                this.closeDialogAt(i);
                return;
            }
        }
        this.openDialogFor(window);
    },

    openDialogFor: function ADM_openDialogFor(window) {
        let dialog = openDialog("chrome://hatenabookmark/content/addDialog.xul",
                                "", "chrome,innerWidth=520,innerHeight=420,resizable=yes", window);
        this.entries.push({
            window: window,
            dialog: dialog,
            isDialogOpen: true
        });
    },

    closeDialogAt: function ADM_closeDialogAt(index) {
        let entry = this.entries[index];
        if (entry.isDialogOpen) entry.dialog.close();
        this.entries.splice(index, 1);
    },

    handleEvent: function ADM_handleEvent(event) {
        switch (event.type) {
        case "unload":
        }
    }
};

function AddDialogEntry(window, dialog) {
}

extend(AddDialogEntry.prototype, {
});

window.addEventListener("load", function () {
    document.getElementById("hBookmark-addToBookmarkButton")
            .addEventListener("click", function () {
                AddDialogManager.toggleDialogFor(gBrowser.selectedBrowser.contentWindow);
            }, false);
}, false);
