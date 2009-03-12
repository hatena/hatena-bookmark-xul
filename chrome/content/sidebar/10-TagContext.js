const EXPORT = ["TagContext"];

function TagContext() {
    this.tags = null;
}

extend(TagContext.prototype, {
    build: function TC_build(popup) {
        let tags = document.popupNode.tags;
        if (!tags || !tags.length) return false;
        this.tags = tags;
        return true;
    },

    openAllBookmarks: function TC_openAllBookmarks() {
        alert('Not implemented');
    },
    openIn: function TC_opneIn(where) {
        let url = "http://b.hatena.ne.jp/" + User.user.name +
                  "/" + this.tags.map(encodeURIComponent).join("/");
        openUILinkIn(url, where);
    },
    delete: function TC_delete() {
        alert('Not implemented');
    },
    rename: function TC_rename() {
        alert('Not implemented');
    }
});
