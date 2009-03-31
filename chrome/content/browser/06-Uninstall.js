
var Uninstaller;
if (shared.has('Uninstaller')) {

    Uninstaller = shared.get('Uninstaller');

} else {

Uninstaller = {
    flag: false,
    observe: function(aSubject, aTopic, aData) {
        if (aTopic == 'em-action-requested') {
            if (aSubject instanceof Ci.nsIUpdateItem && aSubject.id == EXT_ID) {
                switch (aData)
                {
                    case 'item-cancel-action':
                        Uninstaller.flag = false;
                        break;
                    // case 'item-disabled':
                    case 'item-uninstalled':
                        Uninstaller.flag = true;
                        break;
                }
            }
        } else if (aTopic == 'quit-application') {
            if (Uninstaller.flag) {
                let pd = DirectoryService.get("ProfD", Ci.nsIFile);
                pd.append('hatenabookmark');
                if (pd.exists() && pd.isDirectory()) {
                    pd.remove(true);
                }
            }
            ObserverService.removeObserver(Uninstaller, 'em-action-requested');
            ObserverService.removeObserver(Uninstaller, 'quit-application');
        }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
}

ObserverService.addObserver(Uninstaller, 'quit-application', false);
ObserverService.addObserver(Uninstaller, 'em-action-requested', false);

shared.set('Uninstaller', Uninstaller);
};
