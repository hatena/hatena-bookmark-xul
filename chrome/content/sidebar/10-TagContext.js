const EXPORT = ["TagContext"];

function getURIFor(pageType) {
    let base = B_HTTP + User.user.name + "/";
    switch (pageType.toLowerCase()) {
    case "tags":
        let tags = arguments[1];
        return base + tags.map(encodeURIComponent).join("/") + "/";

    case "edittag":
        let tag = arguments[1];
        return base + "tag?tag=" + encodeURIComponent(tag);
    }
}

function TagContext() {
    this.tags = null;
}

extend(TagContext.prototype, {
    strings: new Strings("chrome://hatenabookmark/locale/popups.properties"),

    build: function TC_build(popup) {
        let target = document.popupNode;
        let tags = target.tags;
        if (!tags || !tags.length) return false;
        this.tags = tags.concat();
        this.tag = tags[tags.length - 1];
        let tagsLabel = this._formatTags(this.tags);
        this._setLabel("openBookmarks", [tagsLabel]);
        this._setLabel("deleteBookmarks", [tagsLabel]);
        this._setLabel("filterToolbar", [this.tag]);
        //this._setLabel("editTag", [this.tag]);
        this._setLabel("rename", [this.tag]);
        this._setLabel("delete", [this.tag]);
        let line = this._toolbarRecentLine;
        this._getItem("filterToolbar").hidden =
            !line || !UIUtils.isVisible(line);
        return true;
    },

    _getItem: function TC__getItem(key) {
        return document.getElementById("hBookmark-tag-context-" + key);
    },

    _setLabel: function TC__setLabel(key, args) {
        let item = this._getItem(key);
        let label = this.strings.get("tagContext." + key + "Label", args);
        item.setAttribute("label", label);
        let accessKey = this.strings.get("tagContext." + key + "Key");
        item.setAttribute("accesskey", accessKey);
    },

    _formatTags: function TC__formatTags(tags) "[" + tags.join("][") + "]",

    destroy: function TC_destory() {
        this.tags = null;
    },

    get bookmarks() Model.Bookmark.findByTags(this.tags),

    openBookmarks: function TC_openBookmarks(event) {
        let urls = this.bookmarks.map(function (b) b.url);
        UIUtils.openLinks(urls, event);
    },

    openIn: function TC_opneIn(where) {
        let url = getURIFor("tags", this.tags);
        openUILinkIn(url, where);
    },

    filterToolbar: function TC_filterToolbar() {
        this._toolbarRecentLine.tagFilterPopup.setTag(this.tag);
    },

    rename: function TC_rename() {
        let newTag = { value: "" };
        let error = { value: "" };
        let ok;
        do {
            let message = this.strings.get("prompt.renameDescription",
                                           [this.tag]);
            if (error.value)
                message += "\n\n" + error.value;
            ok = PromptService.prompt(
                     getTopWin(), this.strings.get("prompt.editTagTitle"),
                     message, newTag, null, {});
        } while (ok && !this._validateNewTag(newTag.value, error));
        if (!ok) return;
        let command = new RemoteCommand("edit_tag", {
            query: { tag: this.tag, newtag: newTag.value }
        });
        command.execute();
    },

    _validateNewTag: function TC__validateNewTag(tagName, error) {
        const MAX_BYTE_LENGTH = 32;
        let result = true;
        let message = "";
        let byteLength = unescape(encodeURI(tagName)).length;
        if (!/\S/.test(tagName)) {
            result = false;
        } else if (!/^[^?:%\/\[\]]+(?:\]\[[^?:%\/\[\]]+)*$/.test(tagName)) {
            result = false;
            message = this.strings.get("tagError.invalidCharacter");
        } else if (byteLength > MAX_BYTE_LENGTH) {
            result = false;
            message = this.strings.get("tagError.tooLong",
                                       [MAX_BYTE_LENGTH, byteLength]);
        }
        if (error)
            error.value = message;
        return result;
    },

    delete: function TC_delete() {
        let ok = PromptService.confirm(
                     getTopWin(), this.strings.get("prompt.editTagTitle"),
                     this.strings.get("prompt.deleteDescription", [this.tag]));
        if (!ok) return;
        let command = new RemoteCommand("delete_tag", {
            query: { tag: this.tag }
        });
        command.execute();
    },

    get _toolbarRecentLine() {
        return getTopWin().document.getElementById("hBookmark-toolbar-recent-line");
    },

    editTag: function TC_editTag(event) {
        let url = getURIFor("editTag", this.tag);
        hOpenUILink(url, event);
    },

    deleteBookmarks: function TC_deleteBookmarks() {
        let bookmarks = this.bookmarks;
        if (!UIUtils.confirmDeleteBookmarks(bookmarks)) return;
        let command = new RemoteCommand("delete", {
            bookmarks: bookmarks,
            onError: function () {
                UIUtils.alertBookmarkError("delete", bookmarks);
            }
        });
        command.execute();
    }
});
