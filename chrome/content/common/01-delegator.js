
var EXPORT = ['Delegator'];

/*
 * メソッドの委譲を行う
 */

let Delegator = function(obj, propertyDelegate) {
    this.__target__obj = obj;
    if (typeof propertyDelegate == 'undefined') 
        propertyDelegate = true;

    if (propertyDelegate) {
        this.__propertyDelegate__();
    }
};

Delegator.prototype = {
    get __getTarget__() this.__target__obj,
    __noSuchMethod__: function (method, args) {
        let target = this.__getTarget__;
        return target[method].apply(target, args);
    },
    __propertyDelegate__: function() {
        // XXX: prototype チェインのプロパティはどうする？
        let target = this.__getTarget__;
        let addedKeys = [];
        for (let key in target) {
            if (typeof this[key] == 'undefined') {
                this[key] = target[key];
                addedKeys.push(key);
            }
        }
        return addedKeys;
    }
};


