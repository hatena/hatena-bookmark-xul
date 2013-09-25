# はてなブックマーク Firefox 拡張

* <http://b.hatena.ne.jp/guide/firefox_addon>
* <http://wiki.github.com/hatena/hatena-bookmark-xul>

## 開発者向け情報

### ブランチの使い方

永続的なブランチとして次の 2 つがあります。

* master ブランチ
* dev ブランチ

基本的な開発の流れは、dev ブランチからトピックブランチを切り、開発を進めてトピックブランチを
dev ブランチにマージする、というものです。
リリース時に dev ブランチを master ブランチにマージします。
GitHub で pull request を送る際も、dev ブランチから新たにブランチを切り、dev
ブランチ向けに pull request してください。

### テストについて

古いテストが tests 以下にあるが, うまく動かせないものが多いようである.
最近は QUnit を使って chrome/content/tests 以下にテストを書いているので,
今後テストを追加する場合はそちらに追加すること.

テストを実行させるには, 開発用にソースコードから拡張をインストールした
状態で, 下記 URL にアクセスする.

* chrome://hatenabookmark/content/tests/test.html
