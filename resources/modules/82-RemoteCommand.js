Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ["RemoteCommand"];

const NOP = new Function();

function RemoteCommand(type, options) {
    this.type = type;
    this.options = {
        timeout:    15,
        retryCount: 3
    };
    extend(this.options, options || {});
    this._request = null;
    this._timer = null;
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

        edit_tag                : 'tag.edit.json',
        delete_tag              : 'tag.delete.json',

        // Alias
        delete                  : 'api.delete_bookmark.json'
    }
});

EventService.implement(RemoteCommand.prototype);

extend(RemoteCommand.prototype, {
    get url() {
        return B_HTTP + this.user.name + "/" +
               RemoteCommand.API_ENDPOINT[this.type] + '?editer=fxaddon';
    },

    get query() {
        let query = this.options.query || {};
        query.rks = this.user.rks;
        return query;
    },

    get user() this.options.user || User.user,

    execute: function RC_execute() {
        this.hook();
        this.setTimer();
        this._request = new XMLHttpRequest();
        this._request.mozBackgroundRequest = true;
        this._request.open("POST", this.url);
        this._request.addEventListener("load", this, false);
        this._request.addEventListener("error", this, false);
        let headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie":       "rk=" + User.user.rk
        };
        for (let [field, value] in Iterator(headers))
            this._request.setRequestHeader(field, value);
        this._request.send(net.makeQuery(this.query));
    },

    complete: function RC_complete(success, result) {
        result = result || null;
        this.clearTimer();
        if (success) {
            (this.options.onComplete || NOP).call(this, result);
            this.dispatch("complete");
        } else {
            (this.options.onError || NOP).call(this, result);
            this.dispatch("error");
        }
    },

    setTimer: function RC_setTimer() {
        if (this._timer) return;
        this._timer = new BuiltInTimer(this, this.options.timeout * 1000,
                                       Ci.nsITimer.TYPE_REPEATING_SLACK);
    },

    clearTimer: function RC_clearTimer() {
        if (!this._timer) return;
        this._timer.cancel();
        this._timer = null;
    },

    // nsIDOMEventListener (for nsIXMLHttpRequest)
    handleEvent: function RC_handleEvent(event) {
        p([key + ': ' + value for ([key, value] in Iterator(event))].join("\n"));
        p(this._request.status + "\n" + this._request.responseText);
        let status = (event.type === "load") ? this._request.status : 0;
        // HTTP ステータスコードが 200 なら成功として終了、
        // 4xx なら失敗として終了、5xx なら再挑戦。
        if (200 <= status && status < 500) {
            let result = decodeJSON(this._request.responseText);
            this.complete(status === 200, result);
        } else if (this.options.retryCount <= 0) {
            // 再挑戦できないなら失敗として終了。
            this.complete(false);
        }
        this._request = null;
        // 再挑戦するタイミングは nsITimer によって管理されているので、
        // 再挑戦する場合もここで execute を呼び出す必要はない。
    },

    // nsIObserver (for nsITimer)
    observe: function RC_observe(subject, topic, data) {
        if (topic !== "timer-callback") return;
        if (this._request) {
            this._request.abort();
            this._request = null;
        }
        if (this.options.retryCount-- > 0) {
            this.execute();
        } else {
            this.complete(false);
        }
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
        let user = User.user;
        if (this.options.changeTitle && user.public)
            query.title = bookmark.title;
        if (this.options.addCollection && this.options.asin) {
            query.add_asin = 1;
            query.asin = this.options.asin;
        }
        if (this.options.isPrivate && user.plususer)
            query.private = 1;
        if (this.options.sendMail && user.plususer)
            query.send_mail = 1;
        if (this.options.postTwitter && user.canUseTwitter)
            query.post_twitter = 1;
        if (this.options.postFacebook && user.canUseFacebook)
            query.post_facebook = 1;
        if (this.options.postMixiCheck && user.canUseMixiCheck)
            query.post_mixi_check = 1;
        if (this.options.changeImage && user.public)
            query.image = this.options.image;
        if (user.plususer)
            query.with_status_op = 1;
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
            if (!result && this.onError) this.onError();
        };
    }
});
