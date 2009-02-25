
var EXPORT = ['Delegator'];

/*
 * メソッドの委譲を行う
 */

let Delegator = function(obj) {
    this.__target__obj = obj;
};

Delegator.prototype = {
    get __getTarget__() this.__target__obj,
    __noSuchMethod__: function (method, args) {
        let target = this.__getTarget__;
        return target[method].apply(target, args);
    }
};


