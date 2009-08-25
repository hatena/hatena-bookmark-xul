/*
 * append to your ~/.vimperatorc
 * =====
 * javascript if (typeof hBookmark != 'undefined') liberator.loadScript('chrome://hatenabookmark/content/vimperator/plugin/hatenabookmark.js', {__proto__: this});
 * =====
 */

liberator.plugins.hBookmark = (function() {
    let p = function(msg) {
        Application.console.log('mes: ' + msg);
    }

    styles.registerSheet("chrome://hatenabookmark/skin/vimperator.css");

    let HatenaBookmark = window.hBookmark;

    const DEFAULT_SHORTCUTS = {
        hintsAdd     : 'c',
        hintsComment : 'C',
        add          : ['c'],
        comment      : ['C'],
    };

    const DEFAULT_COMMAND_NAMES = {
        hbsearch             : 'hb[search]',
        hbsearch_tab         : 'hbt[absearch]',
        hbsearch_comment     : 'hbc[mment]',
        hbsearch_comment_tab : 'hbtc[mment]',
        hbsearch_url         : 'hbu[rl]',
        hbsearch_url_tab     : 'hbtu[rl]',
        hbsearch_title       : 'hbti[tle]',
        hbsearch_title_tab   : 'hbtti[tle]',
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

    let globalC = liberator.globalVariables.hBookmark_commands;

    let commandNames = {};
    if (globalC) {
        for (let key in DEFAULT_COMMAND_NAMES) {
            commandNames[key] = globalC[key] || DEFAULT_COMMAND_NAMES[key];
        }
    } else {
        commandNames = DEFAULT_COMMAND_NAMES;
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

    this.__defineGetter__('searchLimit', function() liberator.globalVariables.hBookmark_search_limit || 10);

    plugin.search = function(word, limit, asc, offset) {
        if (!limit) limit = searchLimit;
        return HatenaBookmark.model('Bookmark').search(word, limit, asc, offset);
    }

    plugin.searchByTitle = function(word, limit, asc, offset) {
        if (!limit) limit = searchLimit;
        return HatenaBookmark.model('Bookmark').searchByTitle(word, limit, asc, offset);
    }

    plugin.searchByComment = function(word, limit, asc, offset) {
        if (!limit) limit = searchLimit;
        return HatenaBookmark.model('Bookmark').searchByComment(word, limit, asc, offset);
    }

    plugin.searchByUrl = function(word, limit, asc, offset) {
        if (!limit) limit = searchLimit;
        return HatenaBookmark.model('Bookmark').searchByUrl(word, limit, asc, offset);
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
        execute: function(args, openTag) {
            if (args['-sync']) {
                if (!plugin.user) {
                    liberator.echoerr('You need to login to Hatena first.');
                } else {
                    HatenaBookmark.Sync.sync();
                }
                return;
            }

            if (args['-edit']) {
                plugin.showPanel(args['-edit']);
            } else {
                let url = plugin.command.genURL(args);
                if (openTag) {
                    liberator.open(url, liberator.NEW_TAB);
                } else {
                    liberator.open(url);
                }
            }
        },
        executeTab: function(args) {
            plugin.command.execute(args, true);
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
            completer: null,
            literal: 0,
            argCount: '*',
            bang: true,
        },
        createCompleter: function(titles, searchMethod) {
            return function(context) {
                context.format = {
                    anchored: true,
                    title: titles,
                    keys: { text: "url", description: "url", icon: "icon", extra: "extra"},
                    process: [
                        plugin.command.templateTitleIcon,
                        plugin.command.templateDescription,
                    ],
                }
                let word = context.filter;
                let res = plugin[searchMethod || 'search'](word);
                context.filters = [];
                context.completions = res.map(function(b) new plugin.command.adapter(b));
            }
        }
    };

    plugin.command.options.options = [
        [['-edit', '-e'], commands.OPTION_STRING],
        [['-sync'], commands.OPTION_NOARG],
    ];

    plugin.command.options.completer = plugin.command.createCompleter(['URL','Comment']);

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

    plugin.__defineGetter__('user', function() HatenaBookmark.User.user);

    if (commandNames.hbsearch) commands.addUserCommand(
        [commandNames.hbsearch],
        'Hatena Bookmark Search',
        plugin.command.execute,
        plugin.command.options,
        true
    );

    if (commandNames.hbsearch_tab) commands.addUserCommand(
        [commandNames.hbsearch_tab],
        'Hatena Bookmark Search (open tab)',
        plugin.command.executeTab,
        plugin.command.options,
        true
    );

    plugin.command.options.completer = plugin.command.createCompleter(['URL','Comment'], 'searchByComment');
    if (commandNames.hbsearch_comment) commands.addUserCommand(
        [commandNames.hbsearch_comment],
        'Hatena Bookmark Comment Search',
        plugin.command.execute,
        plugin.command.options,
        true
    );

    if (commandNames.hbsearch_comment_tab) commands.addUserCommand(
        [commandNames.hbsearch_comment_tab],
        'Hatena Bookmark Comment Search (open tab)',
        plugin.command.executeTab,
        plugin.command.options,
        true
    );

    plugin.command.options.completer = plugin.command.createCompleter(['URL','Comment'], 'searchByUrl');
    if (commandNames.hbsearch_url) commands.addUserCommand(
        [commandNames.hbsearch_url],
        'Hatena Bookmark Url Search',
        plugin.command.execute,
        plugin.command.options,
        true
    );

    if (commandNames.hbsearch_url_tab) commands.addUserCommand(
        [commandNames.hbsearch_url_tab],
        'Hatena Bookmark Url Search (open tab)',
        plugin.command.executeTab,
        plugin.command.options,
        true
    );

    plugin.command.options.completer = plugin.command.createCompleter(['URL','Comment'], 'searchByTitle');
    if (commandNames.hbsearch_title) commands.addUserCommand(
        [commandNames.hbsearch_title],
        'Hatena Bookmark Title Search',
        plugin.command.executeTab,
        plugin.command.options,
        true
    );

    if (commandNames.hbsearch_title_tab) commands.addUserCommand(
        [commandNames.hbsearch_title_tab],
        'Hatena Bookmark Title Search (open tab)',
        plugin.command.executeTab,
        plugin.command.options,
        true
    );

    plugin.command.options.completer = plugin.command.createCompleter(['URL','Comment']);

    completion.addUrlCompleter("H", "Hatena Bookmarks", plugin.command.createCompleter(['Hatena Bookmark']));
    config.guioptions['H'] = ['HatenaBookmark Toolbar',['hBookmarkToolbar']];
    config.dialogs.push([
        "hatenabookmark", "HatenaBookmark Config",
        function(){ window.openDialog("chrome://hatenabookmark/content/config.xul","", "chrome,titlebar,toolbar,centerscreen,dialog=no"); }
    ]);

    return plugin;
})();

