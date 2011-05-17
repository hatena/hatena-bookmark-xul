/* Firefox 4 以降では、グローバルオブジェクトが削除される
 * (ウィンドウが閉じられる) と、そのグローバルオブジェクトに
 * 属するコードの実行ができなくなることがある。
 * とりあえずの対策として、追加パネルではなく親ウィンドウの
 * オブジェクトを用いる。
 * 根本的な解決には土台からの作り直しが必要。
 */

const EXPORT = ['ExpireCache', 'RemoteCommand'];

EXPORT.forEach(function (name) {
    this[name] = opener.hBookmark[name];
}, this);
