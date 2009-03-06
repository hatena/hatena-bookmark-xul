
const EXPORT = ["User"];
const MY_NAME_URL = 'http://b.hatena.ne.jp/my.name';

var User;

if (shared.has('User')) {
    User = shared.get('User');
} else {
    /*
     * User オブジェクトは一つだけ
     */
    User = function User_constructor (name, rks) {
        this._name = name;
        this._rks = rks;
    };

    extend(User, {
        login: function User_loginCheck () {
            let xhr = net.get(MY_NAME_URL, null, null, false);
            let res = eval('(' + xhr.responseText + ')');
            if (res.login) {
                this.setUser(res);
                return this.user;
            } else {
                this.clearUser();
                return false;
            }
        },
        logout: function User_clearUser () {
            this.clearUser();
        },
        clearUser: function() {
            this.user.clear();
            delete this.user;
        },
        setUser: function User_setCurrentUser (res) {
            let current = this.user;
            if (current) {
                if (current.name == res.name) {
                    current.rks = res.rks;
                    return current;
                }
            }
            let user = new User(res.name, res.rks);
            this.user = user;
            EventService.dispatch('UserChange', this);
        }
    });
    
    User.prototype = {
        get name() this._name,
        set rks() this._rks = rks,
        get rks() this._rks,
        get database() {
            if (!this._db) {
                this._db = new Database('hatena.bookmark.' + this.name + '.sqlite');
            }
            return this._db;
        },
        get dataURL() sprintf('http://b.hatena.ne.jp/%s/search.data', this.name),
        clear: function user_clear() {
            if (this._db) {
                this._db.connection.close();
            }
        }
    };

    /*
     * cookie observe
     */
    User.LoginObserver = {
        observe: function(aSubject, aTopic, aData) {
            if (aTopic != 'cookie-changed') return;

            let cookie = aSubject.QueryInterface(Ci.nsICookie2);
            if (cookie.host != '.hatena.ne.jp' || cookie.name != 'rk') return;
            /*
             * logout: deleted
             * login: added
             */
            switch (aData)
            {
                case 'added':
                case 'changed':
                    User.login();
                    break;
                case 'deleted':
                case 'cleared':
                    User.logout();
                    break;
                default:
                    break;
            }
        },
        QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
    }
    ObserverService.addObserver(User.LoginObserver, 'cookie-changed', false);

    /*
     * 初回 Firefox 起動時に、cookie が added されるので
     * 明示的なろぐいんは行わない
    EventService.createListener('firstPreload', function() {
        User.login();
    }, null, 100);
    */

    shared.set('User', User);
};

