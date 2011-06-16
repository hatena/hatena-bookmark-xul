Components.utils.import("resource://hatenabookmark/modules/00-utils.jsm");
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ["UserUtils"];

var UserUtils = {
    getProfileIcon: function UU_getProfileIcon(name, isLarge) {
        name = String(name);
        var n = 0;
        for (var i = 0; i < name.length; i++)
            n += name.charCodeAt(i);
        return sprintf('http://cdn%d.www.st-hatena.com/users/%s/%s/profile%s.gif',
                       n % 5, name.substring(0, 2), name, isLarge ? '' : '_s');
    },
    getHomepage: function UU_getHomepage(name, service) {
        return sprintf('http://%s.hatena.ne.jp/%s/', service || 'www', name);
    }
};
