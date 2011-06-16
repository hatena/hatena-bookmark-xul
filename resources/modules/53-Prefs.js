Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ['Prefs'];

var Prefs = function (branchName) {
    if (branchName && branchName[branchName.length-1] != '.')
        throw 'branchName should be "foo.branchName." -> ' + branchName;
    this._branch = branchName;
    EventService.implement(this);
    this.register();
}

Prefs.prototype = {
    get prefs() {
        if (!this._prefs) {
            if (this._branch) {
                this._prefs = PrefService.getBranch(this._branch);
                // add QI
                this._prefs.QueryInterface(Ci.nsIPrefBranch2);
            } else {
                this._prefs = PrefService;
            }
        }
        return this._prefs;
    },

    get branch() this._branch,

    get: function Prefs_get(name, debug) {
        let prefs = this.prefs;
        let type = prefs.getPrefType(name);

        try {
            switch (type)
            {
                case PrefService.PREF_STRING:
                    // for multibyte values
        if (debug) p(['aaa', type, name]);
                    return prefs.getComplexValue(name,
                                                 Ci.nsISupportsString).data;
                    break;
                case PrefService.PREF_INT:
                    return prefs.getIntPref(name);
                    break;
                default:
                    return prefs.getBoolPref(name);
                    break;
            }
        } catch(e) {
            return null;
        }
    },

    set: function Prefs_set(name, value, type) {
        let prefs = this.prefs;
        if (!type) {
            type = prefs.getPrefType(name);
        }
        if (!type) {
            type = typeof value;
        }

        switch (type)
        {
            case PrefService.PREF_STRING:
            case 'string':
                // for multibyte
                prefs.setCharPref(name, unescape(encodeURIComponent(value)));
                break;
            case PrefService.PREF_INT:
            case 'number':
                prefs.setIntPref(name, parseInt(value));
                break;
            default:
                prefs.setBoolPref(name, !!value);
                break;
        }
    },

    getLocalized: function Prefs_getLocalized(name) {
        return this.prefs.getComplexValue(name, Ci.nsIPrefLocalizedString).data;
    },

    clear: function Prefs_clear(name) {
        try {
            this.prefs.clearUserPref(name);
        } catch(e) {}
    },

    register: function Prefs_register () {
        if (!this._observed) {
            this._observed = true;
            this.prefs.addObserver("", this, false);
        }
    },

    unregister: function Prefs_unregister () {
        this._observed = false;
        this.prefs.removeObserver("", this);
    },

    observe: function Prefs_observe (aSubject, aTopic, aData) {
        if (aTopic != "nsPref:changed") return;
        this.dispatch(aData);
    },
};

Prefs.global = new Prefs('');
Prefs.bookmark = new Prefs('extensions.hatenabookmark.');
Prefs.link = new Prefs('extensions.hatenabookmark.link.');
