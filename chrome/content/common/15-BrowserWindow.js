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
 * The Original Code is the Places Command Controller.
 *
 * The Initial Developer of the Original Code is Google Inc.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Ben Goodger <beng@google.com>
 *   Myk Melez <myk@mozilla.org>
 *   Asaf Romano <mano@mozilla.com>
 *   Sungjoon Steve Won <stevewon@gmail.com>
 *   Dietrich Ayala <dietrich@mozilla.com>
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

const EXPORT = ["BrowserWindow"];

// chrome://browser/content/utilityOverlay.js
// を読み込んでおく必要あり。
var BrowserWindow = {
    openLinks: function BW_openLinks(uris, event) {
        if (!this.confirmOpenInTabs(uris.length)) return;
        this.forceOpenLinks(uris, event);
    },

    confirmOpenInTabs: function BW_confirmOpenInTabs(openCount) {
        const WARN_ON_OPEN = "browser.tabs.warnOnOpen";
        const MAX_OPEN_BEFORE_WARN = "browser.tabs.maxOpenBeforeWarn";

        let reallyOpen = true;
        if (Prefs.global.get(WARN_ON_OPEN) &&
            openCount >= Prefs.global.get(MAX_OPEN_BEFORE_WARN)) {
            let PS = Cc["@mozilla.org/embedcomp/prompt-service;1"].
                     getService(Ci.nsIPromptService);
            let warnOnOpen = { value: true };
            let brandStrings =
                new Strings("chrome://branding/locale/brand.properties");
            let brandShortName = brandStrings.get("brandShortName");
            let placesStrings =
                new Strings("chrome://browser/locale/places/places.properties");

            let buttonPressed = PS.confirmEx(
                window, placesStrings.get("tabs.openWarningTitle"),
                placesStrings.get("tabs.openWarningMultipleBranded",
                                  [openCount, brandShortName]),
                PS.BUTTON_TITLE_IS_STRING * PS.BUTTON_POS_0 +
                    PS.BUTTON_TITLE_CANCEL * PS.BUTTON_POS_1,
                placesStrings.get("tabs.openButtonMultiple"), null, null,
                placesStrings.get("tabs.openWarningPromptMeBranded",
                                  [brandShortName]),
                warnOnOpen);
            reallyOpen = (buttonPressed === 0);
            if (reallyOpen && !warnOnOpen.value)
                Prefs.global.set(WARN_ON_OPEN, false);
        }
        return reallyOpen;
    },

    forceOpenLinks: function BW_forceOpenLinks(uris, event) {
        let win = getTopWin();
        let where = whereToOpenLink(event, false, true);
        if (!win || where === "window") {
            window.openDialog(getBrowserURL(), "_blank",
                              "chrome,all,dialog=no", uris.join("|"));
            return;
        }
        let loadInBackground = (where === "tabshifted");
        let replaceCurrentTab = (where !== "tab");
        win.getBrowser().loadTabs(uris, loadInBackground, replaceCurrentTab);
    }
};
