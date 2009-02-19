
const EXPORT = ["User"];
const MY_NAME_URL = 'http://b.hatena.ne.jp/my.name';

var User = function User_constructor (name, rks) {
    this._name = name;
    this._rks = rks;
};

extend(User, {
    login: function() {
        let xhr = wait.xhr('GET', MY_NAME_URL, true);
        // var req = new XMLHttpRequest();
        // req.open('GET', MY_NAME_URL, true);
        // req.send(null);
        // req.onreadystatuschange = function() {
        // }
    },
    setCurrentUser: function() {
    }
});

User.prototype = {
    get name() this._name,
}

