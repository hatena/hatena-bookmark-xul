
const EXPORT = ['ToolbarInstaller'];

var ToolbarInstaller = {
    install: function() {
        var toolbar = document.getElementById('nav-bar');

        try {
            // Fx 3.0 unified-back-forward-button,reload-button,stop-button,home-button,
            // hBookmark-toolbar-home,quickrestart-button,urlbar-container,search-container
            let bars = toolbar.currentSet.split(',');
            bars = bars.filter(function(n) n.indexOf('hBookmark-toolbar-' == -1));

            let lastButton = null;
            let flag = false;
            let newSet = [];

            for (let i = 0;  i < bars.length; i++) {
                let name = bars[i];
                let el = document.getElementById(name);
                if (flag) {
                    //
                } else if (el && name.indexOf('-button') >= 0 ) {
                    lastButton = el;
                } else if (lastButton) {
                    // -button という ID が無くなった直後に追加
                    newSet.push('hBookmark-toolbar-add-button');
                    newSet.push('hBookmark-toolbar-home-button');
                    // newSet.push('hBookmark-toolbar-dropdown');
                    flag = true;
                }
                newSet.push(name);
            }
            if (flag) {
                newSet = newSet.join(',');
                toolbar.currentSet = newSet;
                toolbar.setAttribute('currentset', newSet);
                document.getElementById('navigator-toolbox').ownerDocument.persist(toolbar.id, 'currentset');
                BrowserToolboxCustomizeDone(true);
            }
        } catch(e) {
            p('install fail!: ' + e.toString());
        }
    }
}

EventService.createListener('Install', function() {
    ToolbarInstaller.install();
});


