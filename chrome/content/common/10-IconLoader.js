/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Feed Writer.
 *
 * The Initial Developer of the Original Code is Google Inc.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Ben Goodger <beng@google.com>
 *   Jeff Walden <jwalden+code@mit.edu>
 *   Asaf Romano <mano@mozilla.com>
 *   Robert Sayre <sayrer@gmail.com>
 *   nanto_vi (TOYAMA Nao) <nanto@moon.email.ne.jp>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const EXPORT = ["IconLoader"];

// chromeな場所からhttpな画像を直接読み込むとセキュリティ上
// まずいかもしれないので別に読み込んでdata URIにする。
//
// XMLHttpRequest ではバイナリを読み込めなかった気が……。
// それにしてもこんな大掛かりなことをする必要があるのか?

// from FeedWriter.js iconDataURIGenerator
function IconLoader(url, callback, object) {
    let channel = IOService.newChannel(url, null, null);
    channel.notificationCallbacks = this;
    channel.asyncOpen(this, null);

    this._channel = channel;
    this._callback = callback;
    this._object = object;
    this._bytes = [];
    this._countRead = 0;
    this._stream = null;
}

extend(IconLoader.prototype, {
    QueryInterface: function IL_QueryInterface(iid) {
        if (iid.equals(Ci.nsISupports)           ||
            iid.equals(Ci.nsIRequestObserver)    ||
            iid.equals(Ci.nsIStreamListener)     ||
            iid.equals(Ci.nsIChannelEventSink)   ||
            iid.equals(Ci.nsIInterfaceRequestor) ||
            iid.equals(Ci.nsIBadCertListener)    ||
            // See bug 358878 comment 11
            iid.equals(Ci.nsIPrompt)             ||
            // See FIXME comment below
            iid.equals(Ci.nsIHttpEventSink)      ||
            iid.equals(Ci.nsIProgressEventSink)  ||
            false)
            return this;

        throw Cr.NS_ERROR_NO_INTERFACE;
    },

    // nsIRequestObserver
    onStartRequest: function IL_onStartRequest(request, context) {
        this._stream = Cc["@mozilla.org/binaryinputstream;1"].
                       createInstance(Ci.nsIBinaryInputStream);
    },

    onStopRequest: function IL_onStopRequest(request, context, statusCode) {
        let succeeded = Components.isSuccessCode(statusCode) &&
                        (!(request instanceof Ci.nsIHttpChannel) ||
                         request.requestSucceeded);
        if (succeeded && this._countRead) {
            let contentType = this._channel.contentType;
            if (!/^image\//.test(contentType))
                contentType = "image/x-icon";
            let sequence = String.fromCharCode.apply(null, this._bytes);
            let dataURI = "data:" + contentType + ";base64," + btoa(sequence);
            this._callback.call(this._object, dataURI);
        }
        this._channel = null;
        this._callback = null;
        this._object = null;
        this._stream = null;
    },

    // nsIStreamListener
    onDataAvailable: function IL_onDataAvailable(request, context,
                                                 inputStream, offset, count) {
        this._stream.setInputStream(inputStream);
        // Get a byte array of the data
        this._bytes.push.apply(this._bytes, this._stream.readByteArray(count));
        this._countRead += count;
    },

    // nsIChannelEventSink
    onChannelRedirect: function IL_onChannelRedirect(oldChannel, newChannel,
                                                     flags) {
        this._channel = newChannel;
    },

    // nsIInterfaceRequestor
    getInterface: function IL_getInterface(iid) {
        return this.QueryInterface(iid);
    },

    // nsIBadCertListener
    confirmUnknownIssuer: function IL_confirmUnknownIssuer(socketInfo, cert,
                                                           certAddType) {
        return false;
    },

    confirmMismatchDomain: function IL_confirmMismatchDomain(socketInfo,
                                                             targetURL, cert) {
        return false;
    },

    confirmCertExpired: function IL_confirmCertExpired(socketInfo, cert) {
        return false;
    },

    notifyCrlNextupdate: function IL_notifyCrlNextupdate(socketInfo,
                                                         targetURL, cert) {},

    // FIXME: bug 253127
    // nsIHttpEventSink
    onRedirect: function IL_onRedirect(channel, newChannel) {},
    // nsIProgressEventSink
    onProgress: function IL_onProgress(request, context,
                                       progress, progressMax) {},
    onStatus: function IL_onStatus(request, context, status, statusArg) {}
});
