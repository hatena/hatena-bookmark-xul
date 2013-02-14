# はてなブックマーク Firefox 拡張

* <http://b.hatena.ne.jp/guide/firefox_addon>
* <http://wiki.github.com/hatena/hatena-bookmark-xul>

## 開発者向け情報

### テストについて

古いテストが tests 以下にあるが, うまく動かせないものが多いようである.
最近は QUnit を使って chrome/content/tests 以下にテストを書いているので,
今後テストを追加する場合はそちらに追加すること.

テストを実行させるには, 開発用にソースコードから拡張をインストールした
状態で, 下記 URL にアクセスする.

* chrome://hatenabookmark/content/tests/test.html
