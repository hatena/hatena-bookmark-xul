/*
 * append to your ~/.vimperatorc
 * =====
 * javascript if (typeof hBookmark) liberator.loadScript('chrome://hatenabookmark/content/vimperator/plugin/hatenabookmark.js', {__proto__: this});
 * =====
 */

liberator.plugins.hBookmark = (function() {
    let p = function(msg) {
        Application.console.log('mes: ' + msg);
    }

    let HatenaBookmark = window.hBookmark;

    const DEFAULT_SHORTCUTS = {
        hintsAdd     : 'c',
        hintsComment : 'C',
        add          : ['c'],
        comment      : ['C'],
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

    if (shortcuts.hintsAdd) {
        hints.addMode(shortcuts.hintsAdd, 'Hatena Bookmark - Add', function(elem) {
            let link = elem.href;
            if (link)
                plugin.showPanel(link);
        });
    }

    if (shortcuts.hintsComment) {
        hints.addMode(shortcuts.hintsComment, 'Hatena Bookmark - Comment', function(elem) {
            let link = elem.href;
            if (link)
                plugin.showComment(link);
        });
    }

    if (shortcuts.comment && shortcuts.comment.length) {
        mappings.addUserMap([modes.NORMAL], 
            shortcuts.comment,
            'HatenaBookmark - Comment (toggle)',
            function() {
                plugin.toggleComment();
            }, {
            noremap: true,
            }
        );
    }

    if (shortcuts.add && shortcuts.add.length) {
        mappings.addUserMap([modes.NORMAL], 
            shortcuts.add,
            'HatenaBookmark - Add',
            function() {
                plugin.showPanel();
            }, {
            noremap: true,
            }
        );
    }

    plugin.search = function(word, limit) {
        limit = limit || liberator.globalVariables.hBookmark_search_limit || 10;
        return HatenaBookmark.model('Bookmark').search(word, limit);
    }

    let BookmarkAdapter = new Struct('b');
    BookmarkAdapter.prototype.__defineGetter__('title', function() this.b.title);
    BookmarkAdapter.prototype.__defineGetter__('comment', function() this.b.comment);
    BookmarkAdapter.prototype.__defineGetter__('url', function() this.b.url);
    BookmarkAdapter.prototype.__defineGetter__('icon', function() this.b.favicon);
    BookmarkAdapter.prototype.__defineGetter__("extra", function () [
        ["comment", this.comment, "Comment"],
    ].filter(function (item) item[1]));

    plugin.command = {
        execute: function(args) {
            let url = plugin.command.genURL(args);
            liberator.open(url);
        },
        executeTab: function(args) {
            let url = plugin.command.genURL(args);
            liberator.open(url, liberator.NEW_TAB);
        },
        genURL: function(args) {
            let url = (args.string || '').replace(/\s/g, '');
            if (url.length) {
                if (args.bang) {
                    return 'http://b.hatena.ne.jp/entry/' + url.replace('#', '%23');
                } else {
                    return url;
                }
            } else {
                if (args.bang) {
                    return 'http://b.hatena.ne.jp/';
                } else {
                    return 'http://b.hatena.ne.jp/my';
                }
            }
        },
        adapter: BookmarkAdapter,
        templateDescription: function (item, text) {
           return <>
               {
                   !(item.extra && item.extra.length) ? "" :
                   <span class="extra-info">
                       {
                           template.map(item.extra, function (e)
                           <><span highlight={e[2]}>{e[1]}</span></>,
                           <>&#xa0;</>/* Non-breaking space */)
                       }
                   </span>
               }
           </>
        },
        templateTitleIcon: function (item, text) {
           var simpleURL = text.replace(/^https?:\/\//, '');
           if (simpleURL.indexOf('/') == simpleURL.length-1)
               simpleURL = simpleURL.replace('/', '');
           return <><span highlight="CompIcon">{item.icon ? <img src={item.icon}/> : <></>}</span><span class="td-strut"/>{item.item.title}

           <a href={item.item.url} highlight="simpleURL"><span class="extra-info">{
                 simpleURL
           }</span></a>
           </>
        },
        options: {
            completer: function(context) {
                context.format = {
                    anchored: true,
                    title: ['URL', 'Comment'],
                    keys: { text: "url", description: "url", icon: "icon", extra: "extra"},
                    process: [
                        plugin.command.templateTitleIcon,
                        plugin.command.templateDescription,
                    ],
                }
                let word = context.filter;
                let res = plugin.search(word);
                context.filters = [];
                context.completions = res.map(function(b) new plugin.command.adapter(b));
            },
            literal: 0,
            argCount: '+',
            bang: true,
        }
    };

    plugin.toggleComment = function(url) {
        HatenaBookmark.CommentViewer.toggle(url);
    }

    plugin.showComment = function(url) {
        HatenaBookmark.CommentViewer.show(url);
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

    commands.addUserCommand(
        ['hb[search]'],
        'Hatena Bookmark Search',
        plugin.command.execute,
        plugin.command.options,
        true
    );

    commands.addUserCommand(
        ['hbt[absearch]'],
        'Hatena Bookmark Search (open tab)',
        plugin.command.executeTab,
        plugin.command.options,
        true
    );

    return plugin;
})();

