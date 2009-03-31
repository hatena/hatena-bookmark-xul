

liberator.plugins.hBookmark = (function() {
    let HatenaBookmark = window.hBookmark;

    const DEFAULT_SHORTCUTS = {
        hintsAdd     : 'b',
        hintsComment : 'B',
        add          : 'c',
        comment      : 'C',
    };

    let globalS = liberator.globalVariables.hBookmark_shortcuts;
    let shortcuts = {};
    if (globalS) {
        for (let key in DEFAULT_SHORTCUTS) {
            shortcuts[key] = globalS[key] || DEFAULT_SHORTCUTS[key];
        }
    } else {
        shortcuts = DEFAULT_SHORTCUTS;
    }


    let plugin = {};

    if (shortcuts.hintsAdd)
    hints.addMode(shortcuts.hintsAdd, 'Hatena Bookmark', function(elem) {
        let link = elem.href;
        if (link)
            HatenaBookmark.AddPanelManager.showPanel(link);
    });

    if (shortcuts.hintsComment)
    hints.addMode(shortcuts.hintsComment, 'Hatena Bookmark Comment', function(elem) {
        let link = elem.href;
        if (link)
            HatenaBookmark.CommentViewer.show(link);
    });

    if (shortcuts.comment)
        liberator.execute('noremap ' + shortcuts.comment + ' :javascript liberator.plugins.hBookmark.showComment();<CR>');

    if (shortcuts.add)
        liberator.execute('noremap ' + shortcuts.add + ' :javascript liberator.plugins.hBookmark.showPanel();<CR>');

    plugin.showComment = function() {
        HatenaBookmark.CommentViewer.show();
    }

    plugin.showPanel = function(url, options) {
        if (url) {
            HatenaBookmark.AddPanelManager.showPanel(url, options || {});
        } else if (content.location.href.indexOf('reader.livedoor.com/reader') >= 0) {
              // domain match
              let item = content.window.wrappedJSObject.get_active_item(true);
              if (item) {
                HatenaBookmark.AddPanelManager.showPanel(item.link, {title: item.title});
              }
        } else {
            HatenaBookmark.AddPanelManager.toggle();
        }
    }
    return plugin;
})();


