/*
 * Document: http://wiki.github.com/hatena/hatena-bookmark-xul/vimperator
 *
 * append to your ~/.vimperatorc
 * =====
 * javascript if (typeof hBookmark != 'undefined') liberator.loadScript('chrome://hatenabookmark/content/vimperator/plugin/hatenabookmark.js', {__proto__: this});
 * =====
 */

liberator.plugins.hBookmark = (function() {
    let p = function(msg) {
        Application.console.log('mes: ' + msg);
    }

    let plugin = {};

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
        hbsearch_comment     : 'hbc[omment]',
        hbsearch_comment_tab : 'hbtc[omment]',
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

    let bangFunction;
    let bangFunctions =  {
        openNewTab: function(url) {
            let url = plugin.command.genURL(url);
            liberator.open(url, liberator.NEW_TAB);
        },
        entryPage: function() {
            let url = plugin.command.genURL(url, true);
            liberator.open(url, liberator.NEW_TAB);
        }
    }

    let globalBangFunction = liberator.globalVariables.hBookmark_bangFunction;
    if (globalBangFunction) {
        if (typeof globalBangFunction == 'function') {
            bangFunction = globalBangFunction;
        } else {
            bangFunction = bangFunctions[globalBangFunction];
        }
    }

    if (!bangFunction)
        bangFunction = bangFunctions['entryPage'];

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

    plugin.search = function(word, limit, asc, offset) {
        return HatenaBookmark.model('Bookmark').search(word, limit, asc, offset);
    }

    plugin.searchByTitle = function(word, limit, asc, offset) {
        return HatenaBookmark.model('Bookmark').searchByTitle(word, limit, asc, offset);
    }

    plugin.searchByComment = function(word, limit, asc, offset) {
        return HatenaBookmark.model('Bookmark').searchByComment(word, limit, asc, offset);
    }

    plugin.searchByUrl = function(word, limit, asc, offset) {
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
        execute: function(args, openTab) {
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
                if (openTab) {
                    let url = plugin.command.genURL(args.string, args.bang);
                    bangFunctions.openNewTab(url);
                } else {
                    if (args.bang) {
                        bangFunction(args.string || '');
                    } else {
                        let url = plugin.command.genURL(args.string);
                        liberator.open(url);
                    }
                }
            }
        },
        executeTab: function(args) {
            plugin.command.execute(args, true);
        },
        genURL: function(url, bang) {
            let url = (url|| '').replace(/\s/g, '');
            if (url.length) {
                if (bang) {
                    return 'http://b.hatena.ne.jp/entry/' + url.replace('#', '%23');
                } else {
                    return url;
                }
            } else {
                if (bang) {
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
           <span> </span>
           <a highlight="simpleURL"><span class="extra-info">{
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
        _search: function(context, searchMethod) {
             let interval = liberator.globalVariables.hBookmark_search_interval || 1000;
             let limit = liberator.globalVariables.hBookmark_search_limit || 10;
             let maxLimit = liberator.globalVariables.hBookmark_search_max_limit || 100;

             let completions = [];
             let self = this;
             let cancel;
             let canceler;
             let word = context.filter;

             let searcher = function() {
                 let res = plugin[searchMethod || 'search'](word, limit, false, context.completions.length);
                 res = res.map(function(b) new plugin.command.adapter(b));
                 context.completions = context.completions.concat(res);
                 return res;
             }

             let iid = window.setInterval(function() {
                 if (context.completions.length >= maxLimit) {
                     canceler();
                 } else {
                     try {
                         let res = searcher();
                         if (res.length < limit)
                             canceler();
                     } catch(e) {
                         p('error:' + e);
                         canceler();
                     }
                 }
             }, interval);

             cancel = function() window.clearInterval(iid);
             canceler = function() {
                 completions = context.completions;
                 cancel();
                 context.incomplete = false;
                 context.completions = completions; // こうしないと、Generating results が出続ける
             }
             setTimeout(searcher, 0); // 初回検索はタイムラグ無しで
             return cancel;
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
                context.incomplete = true;
                context.filters = [];
                context.anchored = true;

                context.completions = [];
                context.cancel = plugin.command._search(context, searchMethod);
            }
        }
    };

    plugin.command.options.options = [
        [['-edit', '-e'], commands.OPTION_STRING],
        [['-sync'], commands.OPTION_NOARG],
    ];

    plugin.command.options.completer = plugin.command.createCompleter(['URL','Comment']);

    plugin.toggleComment = function(url) {
        if (!url && content.location.href.indexOf('reader.livedoor.com/reader') >= 0) {
              let item = content.window.wrappedJSObject.get_active_item(true);
              if (item) {
                  url = item.link;
              }
        }
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

    if (liberator.version.indexOf("2.") == 0 )
      config.guioptions['H'] = ['HatenaBookmark Toolbar',['hBookmarkToolbar']];
    else
      config.toolbars.hatehaBookmarks = [['hBookmarkToolbar'], "HatenaBookmark Toolbar"];

    config.dialogs.push([
        "hatenabookmark", "HatenaBookmark Config",
        function(){ window.openDialog("chrome://hatenabookmark/content/config.xul","", "chrome,titlebar,toolbar,centerscreen,dialog=no"); }
    ]);

    return plugin;
})();

