
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
        get dataURL() sprintf('http://b.hatena.ne.jp/%s/search.data', this.name),
    };

    EventService.createListener('firstPreload', function() {
        User.login();
    }, null, 100);
    
    shared.set('User', User);
};

