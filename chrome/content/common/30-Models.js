const EXPORT = ["Model"];

var Model = {};

extend(Model, {
    MODELS: [],
    init: function() {
        if (this._init) return;
        this._init = true;
    },
    get db() {
        if (!this._init) this.init();
        if (this._db) return this._db;

        // var db = new Database('hatena.bookmark.sqlite');
        // return this.db = db;
    },
    set db(db) {
        this._db = db;
        return db;
    },
    resetAll: function() {
        this.deleteAll();
        this.createAll();
    },
    deleteAll: function() {
        this.MODELS.forEach(function(m) {
            try { 
                Model[m].deinitialize() 
            } catch(e) {
                log.error(e);
            }
        });
    },
    createAll: function() {
        var models = this.MODELS.forEach(function(m) Model[m].initialize());
    },
});

Model.Entity = function (def) {
    let model = extend(Entity(def), {
        get db() {
            return User.user ? User.user.database : Model.db;
        }
    });
    return model;
};


