const EXPORT = ["RemoteCommand"];

const NOP = new Function();

function RemoteCommand(type, options) {
    this.type = type;
    this.options = {
        timeout:    15,
        retryCount: 3
    };
    extend(this.options, options || {});
    this.xhr = null;
    this._timerId = 0;
    this.resetListeners(); // EventService
}

extend(RemoteCommand, {
    API_ENDPOINT: {
        edit                    : 'add.edit.json',
        tags                    : 'tags.json',
        entry                   : 'entry.json',
        information_html        : 'partial.information',
        delete_bookmark         : 'api.delete_bookmark.json',
        interesting             : 'api.interesting.json',
        not_interesting         : 'api.not_interesting.json',
        ignore                  : 'api.ignore.json',
        unignore                : 'api.unignore.json',
        ignoring                : 'api.ignoring.json',
        unfollow                : 'api.unfollow.json',
        follow                  : 'api.follow.json',
        following               : 'api.following.json',
        follow_suggest_ignore   : 'api.follow_suggest_ignore.json',
        unfollow_suggest_ignore : 'api.unfollow_suggest_ignore.json',

        // Alias
        delete                  : 'api.delete_bookmark.json'
    }
});

EventService.implement(RemoteCommand.prototype);

extend(RemoteCommand.prototype, {
    get url RC_get_url() {
        return "http://b.hatena.ne.jp/" + this.user.name + "/" +
               RemoteCommand.API_ENDPOINT[this.type] + '?editer=fxaddon';
    },

    get query RC_get_query() {
        let query = this.options.query || {};
        query.rks = this.user.rks;
        return query;
    },

    get user RC_get_user() this.options.user || User.user,

    execute: function RC_execute() {
        this.hook();
        this.xhr = net.post(this.url, method(this, 'onComplete'),
                            method(this, 'onError'), true, this.query);
        this.setTimeoutHandler();
    },

    onComplete: function RC_onComplete(xhr) {
        this.clearTimeoutHandler();
        let json = decodeJSON(xhr.responseText);
        (this.options.onComplete || NOP).call(this, json);
        this.dispatch("complete");
    },

    onError: function RC_onError() {
        this.clearTimeoutHandler();
        if (this.options.retryCount) {
            this.retry();
        } else {
            (this.options.onError || NOP).call(this);
            this.dispatch("error");
        }
    },

    retry: function RC_retry() {
        this.execute();
        this.options.retryCount--;
        this.dispatch("retry");
    },

    setTimeoutHandler: function RC_setTimeoutHandler() {
        this._timerId = setTimeout(function (self) {
            self.clearTimeoutHandler();
            self.xhr.abort();
            self.onError();
        }, this.options.timeout * 1000, this);
    },

    clearTimeoutHandler: function RC_clearTimeoutHandler() {
        if (this._timerId)
            clearTimeout(this._timerId);
        this._timerId = 0;
    },

    hook: function RC_hook() {
        let hookName =
            this.type.replace(/_(.)/g, function (m, c) c.toUpperCase()) + "Hook";
        if (hookName in this)
            this[hookName]();
    },

    editHook: function RC_editHook() {
        let bookmark = this.options.bookmark;
        if (this.options.query || !bookmark) return;
        let query = {
            url:     bookmark.url,
            comment: bookmark.comment
        };
        if (this.options.changeTitle && User.user.public)
            query.title = bookmark.title;
        if (this.options.addCollection && this.options.asin) {
            query.add_asin = 1;
            query.asin = this.options.asin;
        }
        if (this.options.changeImage && User.user.public)
            query.image = this.options.image;
        this.options.query = query;
    },

    deleteHook: function RC_deleteHook() {
        let options = this.options;
        if (options.query || (!options.bookmark && !options.bookmarks))
            return;
        this.options.query = options.bookmark
            ? { url: options.bookmark.url }
            : { urllist: options.bookmarks.map(function (b) b.url).join("|") };
        let bookmarks = options.bookmarks || [options.bookmark];
        let onComplete = this.options.onComplete
        this.options.onComplete = function (result) {
            if (onComplete)
                onComplete.apply(this, arguments);
            //if (!result || !result.success) {
            // サーバの success = 0 のときはすでにエントリーがないので、ローカル DB はけしとく
            if (!result) {
                this.onError();
                return;
            }
            p('remove bookmarks', bookmarks.map(function (b) b.url).join("\n"));
            Model.Bookmark.deleteBookmarks(bookmarks);
        };
        this.options.onError = this.options.onError || function () {
            UIUtils.alertBookmarkError('delete', bookmarks);
        };
    }
});
