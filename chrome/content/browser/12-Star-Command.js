
function Command(command, query, callback) {
    if (typeof query === 'object')
        query = net.makeQuery(query);
    this.method = command.method || 'GET';
    this.url = Star.BASE_URI + command.name;
    if (this.method === 'GET')
        this.url += '?' + query;
    this.headers = {};
    if (User.user)
        this.headers['Cookie'] = 'rk=' + encodeURIComponent(User.user.rk);
    this.body = null;
    if (this.method === 'POST') {
        this.body = query;
        this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    this.trialCount = command.trialCount || Command.DEFAULT_TRIAL_COUNT;
    this.timeout = command.timeout || Command.DEFAULT_TIMEOUT;
    this.request = null;
    this.timer = null;
    this.callback = callback;
    this.invoke();
}

extend(Command, {
    LOAD_STARS: {
        method: 'POST',
        name:   'entries.simple.json',
    },
    LOAD_ALL_STARS: {
        method: 'GET',
        name:   'entry.json',
    },
    ADD_STAR: {
        method: 'GET',
        name:   'star.add.json',
    },
    GET_AVAILABLE_COLORS: {
        method: 'GET',
        name:   'colorpalette.json',
    },
    SET_COLOR: {
        method: 'POST',
        name:   'colorpalette.json',
    },

    DEFAULT_TRIAL_COUNT: 3,
    DEFAULT_TIMEOUT: 15 * 1000,
});

extend(Command.prototype, {
    invoke: function SC_invoke() {
        this.request = new XMLHttpRequest();
        this.request.open(this.method, this.url)
        for (let [name, value] in new Iterator(this.headers))
            this.request.setRequestHeader(name, value);
        this.request.addEventListener('load', this, false);
        this.request.addEventListener('error', this, false);
        this.request.addEventListener('progress', this, false);
        this.request.send(this.body);
        this.setTimer();
    },

    setTimer: function SC_setTimer() {
        if (this.timer)
            this.timer.cancel();
        else
            this.timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
        this.timer.init(this, this.timeout, Ci.nsITimer.TYPE_ONE_SHOT);
    },

    invokeCallback: function SC_invokeCallback(result) {
        try {
            this.callback(result);
        } finally {
            this.dispose();
        }
    },

    cancel: function SC_cancel() {
        if (!this.request) return;
        this.request.abort();
        this.dispose();
    },

    dispose: function SC_dispose() {
        this.request.removeEventListener('load', this, false);
        this.request.removeEventListener('error', this, false);
        this.request.removeEventListener('progress', this, false);
        this.request = null;
        this.timer.cancel();
        this.timer = null;
    },

    handleEvent: function SC_handleEvent(event) {
        switch (event.type) {
        case 'load':
            let result = decodeJSON(this.request.responseText);
            if (result) {
                if ('rks' in result)
                    Star.rks = result.rks;
                this.invokeCallback(result);
                break;
            }
            /* FALL THROUGH */
        case 'error':
        case 'timeout':
            if (--this.trialCount > 0)
                this.invoke();
            else
                this.invokeCallback(null);
            break;
        case 'progress':
            this.setTimer();
            break;
        }
    },

    observe: function SC_observe(subject, topic, data) {
        this.request.abort();
        this.handleEvent({ type: 'timeout' });
    },
});

Star.Command = Command;
