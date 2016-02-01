Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

var EXPORTED_SYMBOLS = ["UserUtils"];

var UserUtils = {
    getProfileIcon: function UU_getProfileIcon(name, isLarge) {
        name = String(name);
        return sprintf('http://cdn1.www.st-hatena.com/users/%s/%s/profile%s.gif',
                       name.substring(0, 2), name, isLarge ? '' : '_s');
    },
    getHomepage: function UU_getHomepage(name, service) {
        return sprintf('http://%s.hatena.ne.jp/%s/', service || 'www', name);
    }
};
