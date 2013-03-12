/*
 * Document: http://wiki.github.com/hatena/hatena-bookmark-xul/vimperator
 *
 * append to your ~/.vimperatorc
 * =====
 * javascript if (typeof hBookmark != 'undefined') liberator.loadScript('chrome://hatenabookmark/content/vimperator/plugin/hatenabookmark.js', {__proto__: this});
 * =====
 */

var PLUGIN_DIR_CHROME_URI = "chrome://hatenabookmark/content/vimperator/plugin/";

if (typeof XMLList === "undefined") {
    liberator.loadScript(PLUGIN_DIR_CHROME_URI + "hatenabookmark-wo-e4x.js", this);
} else {
    liberator.loadScript(PLUGIN_DIR_CHROME_URI + "hatenabookmark-w-e4x.js", this);
}
