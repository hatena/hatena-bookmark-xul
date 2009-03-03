//
//EXPORT = ['Prefs'];
//
//Prefs = function (branchName) {
//    if (branchName && branchName[-1] != '.')
//        throw 'branchName should be "foo.branchName."';
//    this._branch = branchName;
//}
//
//Prefs.prototype = {
//    get prefs function() {
//        if (!this._prefs) {
//            if (this._branch) {
//                this._prefs = PrefService.getBranch(this._branch);
//            } else {
//                this._prefs = PrefService;
//            }
//        }
//        return this._prefs;
//    },
//    get branch function() this._branch,
//    get: function Prefs_get(name) {
//        let type = PrefService.getPrefType(name);
//        let prefs = this.prefs;
//        try {
//            switch (type)
//            {
//                case PrefService.PREF_STRING:
//                    // for multibyte
//                    return decodeURIComponent(escape(prefs.getCharPref(name)));
//                    break;
//                case PrefService.PREF_INT:
//                    return prefs.getIntPref(name);
//                    break;
//                default:
//                    return prefs.getBoolPref(name);
//                    break;
//            }
//        } catch(e) {
//            return null;
//        }
//    },
//    set: function Prefs_set(name, value, type) {
//        if (!type) {
//            type = PrefService.getPrefType(name);
//        }
//        let prefs = this.prefs;
//
//        switch (type)
//        {
//            case PrefService.PREF_STRING:
//            case 'string':
//                // for multibyte
//                prefs.setCharPref(name, unescape(encodeURIComponent(value)));
//                break;
//            case PrefService.PREF_INT:
//            case 'number':
//                prefs.setIntPref(name, parseInt(value));
//                break;
//            default:
//                prefs.setBoolPref(name, !!value);
//                break;
//        }
//    },
//    clear: function Prefs_clear(name) {
//        prefs.clearUserPref(name);
//    },
//    //createListener: function Prefs_createListener (observer, ) {
//    //},
//    //removeListener: function Prefs_removeListener (listener) {
//    //}
//};
//
//Prefs.global = new Prefs();
//Prefs.bookmark = new Prefs('exceptions.hatenabookmark.');

