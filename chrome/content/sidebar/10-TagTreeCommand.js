const EXPORT = ["TagTreeCommand"];

function TagTreeCommand(view) {
    this.view = view;
    this.tags = [];
}

extend(TagTreeCommand.prototype, {
    openAllBookmarks: function TTC_openAllBookmarks(tags) {
        alert(arguments.callee.name + "\n" + tags.join(", "));
    },

    open: function TTC_open(tags) {
        var uri = this._getTagPageURI(tags);
        Application.activeWindow.activeTab.load(uri);
    },

    openInNewTab: function TTC_openInNewTab(tags) {
        var uri = this._getTagPageURI(tags);
        Application.activeWindow.open(uri).focus();
    },

    _getTagPageURI: function TTC__getTagPageURI(tags) {
        // XXX ユーザー名を取得する必要あり。
        return newURI("http://b.hatena.ne.jp/maoe/" +
                      tags.map(encodeURIComponent).join("/"));
    },

    delete: function TTC_delete(tags) {
        alert(arguments.callee.name + "\n" + tags.join(", "));
    },

    rename: function TTC_rename(tags) {
        alert(arguments.callee.name + "\n" + tags.join(", "));
    },

    handleEvent: function TTMC_handleEvent(event) {
        switch (event.type) {
        case "command":
            if (!this.tags.length) break;
            let command = event.target.id.substring("tag-tree-".length);
            this[command](this.tags);
            break;

        case "popupshowing":
            this.tags = this.view.wrappedJSObject.selectedTags;
            break;
        }
    }
});
