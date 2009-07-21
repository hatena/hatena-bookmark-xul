const EXPORT = ["WebProgressListenerPrototype"];

var WebProgressListenerPrototype = {
    onLocationChange: function (progress, request, location) {},
    onStateChange: function (progress, request, flags, status) {},
    onProgressChange: function (progress, request, curSelf, maxSelf,
                                curTotal, maxTotal) {},
    onProgressChange64: function (progress, request, curSelf, maxSelf,
                                  curTotal, maxTotal) {},
    onStatusChange: function (progress, request, status, message) {},
    onSecurityChange: function (progress, request, state) {},
    onRefreshAttempted: function (progress, refreshURI, millis, sameURI) true,
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIWebProgressListener,
        Ci.nsIWebProgressListener2,
        Ci.nsISupportsWeakReference,
    ]),
};
