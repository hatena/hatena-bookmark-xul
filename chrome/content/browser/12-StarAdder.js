const EXPORT = ['StarAdder'];

const STAR_API_BASE = 'http://s.hatena.ne.jp/';

const COMMAND_ADD_STAR = 'star.add.json';
const COMMAND_COLOR_PALETTE = 'colorpalette.json';

function StarAdder(url, title, location) {
    this.url = url;
    this.title = this.title || '';
    this.location = location || '';
    this.currentColor = StarAdder.COLOR_YELLOW;
    this.token = '';
}

extend(StarAdder, {
    COLOR_YELLOW: 'yellow',
    COLOR_GREEN:  'green',
    COLOR_RED:    'red',
    COLOR_BLUE:   'blue',
    COLOR_PURPLE: 'purple',

    DEFAULT_RETRY_COUNT: 3,
    REQUEST_TIMEOUT: 15 * 1000,

    get isAvailable SA_s_get_isAvailable() !!(User.user && this.rks),
    rks: '',
});

extend(StarAdder.prototype, {
    get rks SA_get_rks() StarAdder.rks,

    getAvailableColors: function SA__getAvailableColors(callback) {
        this._tryRequest('GET', COMMAND_COLOR_PALETTE,
                         { uri: this.url }, bind(onGotPalette, this))

        function onGotPalette(res) {
            if (!res) {
                callback(null);
                return;
            }
            this.currentColor = res.color;
            this.token = res.token;
            callback(res.color_star_counts);
        }
    },

    // If you want to add a colored star, you must call |getAvailableColors|
    // before calling |add|.
    add: function SA_add(color, quote, callback) {
        quote = (quote === null || quote === undefined) ? '' : String(quote);
        if (!color || color === StarAdder.COLOR_YELLOW)
            this._addNormalStar(quote, callback);
        else
            this._addColoredStar(color, quote, callback);
    },

    _addNormalStar: function SA__addNormalStar(quote, callback) {
        let query = {
            quote:    quote,
            uri:      this.url,
            location: this.location,
            rks:      this.rks,
        };
        this._tryRequest('GET', COMMAND_ADD_STAR, query, callback);
    },

    _addColoredStar: function SA__addColoredStar(color, quote, callback) {
        let query = {
            color: color,
            token: this.token,
            uri:   this.url,
        };
        this._tryRequest('POST', COMMAND_COLOR_PALETTE, query,
                         bind(onSentColor, this));

        function onSentColor(res) {
            if (!res) {
                callback(null);
                return;
            }
            let query = {
                quote:    quote,
                uri:      this.url,
                title:    this.title,
                location: this.location,
                rks:      this.rks,
            };
            this._tryRequest('GET', COMMAND_ADD_STAR, query, callback);
        }
    },

    _tryRequest: function SA__tryRequest(method, command, query,
                                         callback, retryCount) {
        if (typeof retryCount === 'undefined')
            retryCount = StarAdder.DEFAULT_RETRY_COUNT;
        this._request(method, command, query, bind(onResult, this));

        function onResult(res) {
            if (res || retryCount <= 1)
                callback(res);
            else
                this._tryRequest(method, command, query, callback, retryCount - 1);
        }
    },

    _request: function SA__request(method, command, query, callback) {
        method = method.toUpperCase();
        if (query && typeof query === 'object')
            query = net.makeQuery(query);
        let url = STAR_API_BASE + command;
        if (method === 'GET')
            url += '?' + query;
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Cookie', 'rk=' + encodeURIComponent(User.user.rk));
        xhr.onload = onEvnet;
        xhr.onerror = onEvnet;
        let postData = null;
        if (method === 'POST') {
            postData = query;
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        xhr.send(postData);
        let timer = new BuiltInTimer({ observe: onTimeout },
                                     StarAdder.REQUEST_TIMEOUT,
                                     Ci.nsITimer.TYPE_ONE_SHOT);

        function onEvnet(event) {
            dispose();
            let res = (event.type === 'load')
                      ? decodeJSON(xhr.responseText) : null;
            callback(res);
        }
        function onTimeout() {
            onEvnet({ type: 'timeout' });
        }
        function dispose() {
            xhr.onload = null;
            xhr.onerror = null;
            timer.cancel();
            timer = null;
        }
    },
});
