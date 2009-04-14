const EXPORT = ["SelectTagDialogManager"];

function SelectTagDialogManager(dialog) {
    this.dialog = dialog;
    this.dialog.manager = this;
    this.tagList = new TagList(document.getElementById("tag-list"));
}

extend(SelectTagDialogManager.prototype, {
    destroy: function STDM_destroy() {
        p('destroy SelectTagDialogManager');
        this.dialog.manager = null;
        this.dialog = null;
        this.tagList = null;
    },

    onAccept: function STDM_onAccept(event) {
    }
});
