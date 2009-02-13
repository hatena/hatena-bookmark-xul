// XXX 既存のモデル用ソースコードを流用

const EXPORTED_SYMBOLS = [
    "p", "model", "Database", "Entity", "Model", "hBookmark"
];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Application =
    Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
const StorageService =
    Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
const StorageStatementWrapper =
    Components.Constructor('@mozilla.org/storage/statement-wrapper;1',
                           'mozIStorageStatementWrapper', 'initialize');

var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].
             getService(Ci.mozIJSSubScriptLoader).loadSubScript;
var hBookmark = {};
var files = ["00_utils", "05_database", "06_models"];
files.forEach(function (file) {
    loader("chrome://hatenabookmark/content/javascripts/" + file + ".js");
});

extend(hBookmark.Model.Tag, {
    findDistinctTags: function () this.find({ group: "name" }),

    findRelatedTags: function (tagNames) {
        if (!tagNames || !tagNames.length)
            return this.findDistinctTags();
        var bmIds = null;
        for (var i = 0; i < tagNames.length; i++) {
            var cond = { where: "name = :name", name: tagNames[i] };
            if (bmIds) {
                cond.where +=
                    " AND bookmark_id IN (" + bmIds.join(",") + ")";
            }
            bmIds = this.find(cond).map(function (tag) tag.bookmark_id);
            if (!bmIds.length) return bmIds;
        }
        var condition = { group: "name" };
        var where = "name NOT IN (" + tagNames.map(function (name, i) {
            var paramName = "name" + i;
            condition[paramName] = name;
            return ":" + paramName;
        }).join(",") + ") AND bookmark_id IN (" + bmIds.join(",") + ")";
        condition.where = where;
        return this.find(condition);
    }
});
