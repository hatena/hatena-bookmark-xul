
// pref("extensions.hatenabookmark.testtesttest", 'test');
// set prefs
// pref("extensions.hatenabookmark.config.foobar", "foobar");

pref("extensions.hatenabookmark.migration.version", 0);
pref("extensions.hatenabookmark.everLoggedIn", false);
pref("extensions.hatenabookmark.everBookmarked", false);

// toolbar
// Item count in "Hatena Bookmarks" folder in Bookmarks toolbar.
pref("extensions.hatenabookmark.recentItemCount", 20);
// Obsolete: Instead of this pref, write the following code
// in your userChrome.css file:
//   #hBookmarkToolbar toolbarbutton.bookmark-item { max-width: <length>; }
//pref("extensions.hatenabookmark.toolbar.maxItemWidth", 156);
pref("extensions.hatenabookmark.toolbar.filterTag", "");
pref("extensions.hatenabookmark.toolbar.recentTagCount", 5);
pref("extensions.hatenabookmark.toolbar.recentTags", "");

// for debuge
pref("extensions.hatenabookmark.debug.log", false);

// location bar
pref("extensions.hatenabookmark.locationbar.search", true);
pref("extensions.hatenabookmark.locationbar.searchToggle", true);
pref("extensions.hatenabookmark.locationbar.searchToggleWait", 500);
pref("extensions.hatenabookmark.locationbar.resultRows", 6);

// contextmenu
pref("extensions.hatenabookmark.contextmenu.enabled", true);

// status bar
pref("extensions.hatenabookmark.statusbar.counter", true);
// These two prefs are obsolete.  See 'counterIgnoreList'.
// pref("extensions.hatenabookmark.statusbar.httpsIgnore", true);
// pref("extensions.hatenabookmark.statusbar.counterIngoreList", "");
// local addresses
pref("extensions.hatenabookmark.statusbar.counterIgnoreList", "['\\^https:\\/\\/.*\\$', '\\^https?:\\/\\/192\\\\.168\\\\.\\\\d+\\\\.\\\\d+.*\\$', '\\^https?:\\/\\/172\\\\.((1[6-9])|(2[0-9])|(3[0-1]))\\\\.\\\\d+\\\\.\\\\d+.*\\$', '\\^https?:\\/\\/10\\\\.\\\\d+\\\\.\\\\d+\\\\.\\\\d+.*\\$']");
pref("extensions.hatenabookmark.statusbar.addButton", true);

// addPanel 
pref("extensions.hatenabookmark.addPanel.backgroundImage", '');
pref("extensions.hatenabookmark.addPanel.confirmEntry", false);
pref("extensions.hatenabookmark.addPanel.addCollection", true);
pref("extensions.hatenabookmark.addPanel.sendMail", false);
pref("extensions.hatenabookmark.addPanel.postTwitter", false);
pref("extensions.hatenabookmark.addPanel.postFacebook", false);
pref("extensions.hatenabookmark.addPanel.postMixiCheck", false);
pref("extensions.hatenabookmark.addPanel.maxImageWidth", 100);
pref("extensions.hatenabookmark.addPanel.maxImageHeight", 100);
pref("extensions.hatenabookmark.addPanel.maxImageCount", 20);
pref("extensions.hatenabookmark.addPanel.notifyMetaBookmark", true);
pref("extensions.hatenabookmark.addPanel.notifyCanonicalURL", true);

// addPanel tagsuggest
pref("extensions.hatenabookmark.addPanel.tagCompleteEnabled", true);
pref("extensions.hatenabookmark.addPanel.tagMaxResult", 12);
pref("extensions.hatenabookmark.addPanel.initialTagCount", 30);
pref("extensions.hatenabookmark.addPanel.recommendedTagListShow", true);
pref("extensions.hatenabookmark.addPanel.suggestRecommendedTags", true);
pref("extensions.hatenabookmark.addPanel.alwaysRecommendTagsFromContent", false);
pref("extensions.hatenabookmark.addPanel.tagListShow", true);
pref("extensions.hatenabookmark.addPanel.tagListShowAll", false);
// Deprecated.  Use initialTagCount instead.
pref("extensions.hatenabookmark.addPanel.frequentTagCount", 30);
pref("extensions.hatenabookmark.addPanel.xulMigemo", true);

// sidebar
pref("extensions.hatenabookmark.sidebar.reverseDirection", false);
pref("extensions.hatenabookmark.sidebar.searchMode", "all");

// comment viewer
pref("extensions.hatenabookmark.commentviewer.allShow", false);
pref("extensions.hatenabookmark.commentviewer.width", 500);
pref("extensions.hatenabookmark.commentviewer.height", 500);
pref("extensions.hatenabookmark.commentviewer.autoFilter", true);
pref("extensions.hatenabookmark.commentviewer.autoFilterThreshold", 15);
pref("extensions.hatenabookmark.commentviewer.autoHoverShow", false);
pref("extensions.hatenabookmark.commentviewer.autoResize", true);

// Sync
pref("extensions.hatenabookmark.sync.oneTimeItmes", 200);
pref("extensions.hatenabookmark.sync.syncWait", 1000);

// Shurtcut
pref("extensions.hatenabookmark.shortcut.keys.add", "Ctrl(Control)+Shift+B");
pref("extensions.hatenabookmark.shortcut.keys.comment", "Ctrl(Control)+Shift+C");
pref("extensions.hatenabookmark.shortcut.keys.sidebar", "");

// Link texts
pref("extensions.hatenabookmark.link.openInNewTab", true);
// Obsoleted.  Use 'captureAddition' instead.
//pref("extensions.hatenabookmark.link.linkOverlay", true);
pref("extensions.hatenabookmark.link.captureAddition", true);
pref("extensions.hatenabookmark.link.captureComments", true);
pref("extensions.hatenabookmark.link.supportTreeStyleTab", true);

// Embed counter, add-bookmark button, and etc. in search result pages
pref("extensions.hatenabookmark.embed.enabled", true);
// Each widgets
pref("extensions.hatenabookmark.embed.counter", true);
pref("extensions.hatenabookmark.embed.comments", true);
pref("extensions.hatenabookmark.embed.addButton", false);
pref("extensions.hatenabookmark.embed.useExternalSiteInfo", true);
// in seconds
pref("extensions.hatenabookmark.embed.siteInfoUpdateInterval", 86400);
// Integrate web search and Hatena Bookmark full-text search
pref("extensions.hatenabookmark.embed.search", true);
pref("extensions.hatenabookmark.embed.searchCount", 5);
pref("extensions.hatenabookmark.embed.searchSnippetLength", 100);
pref("extensions.hatenabookmark.embed.searchSortBy", "scores");
pref("extensions.hatenabookmark.embed.showSearchStandby", true);
