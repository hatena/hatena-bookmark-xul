const EXPORT = ["Strings", "stringsGetter"];

function Strings(propertiesFile) {
    this._bundle = Cc["@mozilla.org/intl/stringbundle;1"]
                   .getService(Ci.nsIStringBundleService)
                   .createBundle(propertiesFile);
}

extend(Strings.prototype, {
    get: function Strings_get(name, args) {
        return args
            ? this._bundle.formatStringFromName(name, args, args.length)
            : this._bundle.GetStringFromName(name);
    }
});
