
let Command = Star.Command;

function Operator(uri, title, location) {
    this.uri = uri;
    this.title = title || '';
    this.location = location || '';
    this.token = '';
}

extend(Operator.prototype, {
    getAvailableColors: function SO_getAvailableColors(callback) {
        return new Command(Command.GET_AVAILABLE_COLORS, { uri: this.uri },
                           bind(onGotPalette, this));
        function onGotPalette(res) {
            if (!res) {
                callback(null);
                return;
            }
            this.token = res.token;
            callback(res.color_star_counts);
        }
    },

    // If you want to add a colored star, you must call |getAvailableColors|
    // before calling |add|.
    add: function SO_add(color, quote, callback) {
        quote = (quote === null || quote === undefined) ? '' : String(quote);
        if (!color || color === Star.COLOR_YELLOW)
            this._addNormalStar(quote, callback);
        else
            this._addColoredStar(color, quote, callback);
    },

    _addNormalStar: function SO__addNormalStar(quote, callback) {
        let query = {
            quote:    quote,
            uri:      this.uri,
            title:    this.title,
            location: this.location,
            rks:      Star.rks,
        };
        new Command(Command.ADD_STAR, query, callback);
    },

    _addColoredStar: function SO__addColoredStar(color, quote, callback) {
        let query = {
            color: color,
            token: this.token,
            uri:   this.uri,
        };
        new Command(Command.SET_COLOR, query, bind(onSetColor, this));
        function onSetColor(res) {
            if (!res) {
                callback(null);
                return;
            }
            let query = {
                quote:    quote,
                uri:      this.uri,
                title:    this.title,
                location: this.location,
                rks:      Star.rks,
            };
            new Command(Command.ADD_STAR, query, callback);
        }
    },
});

Star.Operator = Operator;
