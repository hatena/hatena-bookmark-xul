(function () {

/**
 * データベース関係のテスト
 */

var modules = {};
Components.utils.import("resource://hatenabookmark/modules/60-Database.js", modules);

QUnit.module("Entity");

QUnit.asyncTest("TIMESTAMP 型のフィールドを指定すると自動的に setter/getter が生成される", function () {
    var TimerEntity = modules.Entity({
        name : "timertest",
        fields : {
            timeA : "TIMESTAMP",
        },
    });

    var t = new TimerEntity({ timeA: 12345678 });
    // t.timeA は単なる data property ではなく accessor property

    ok(typeof t.timeA === "object");
    strictEqual(t.timeA.getTime(), 12345678);

    // setter なので, 単なる数値を代入しても Date オブジェクトに変換される
    t.timeA = 7654321;
    strictEqual(t.timeA.getTime(), 7654321);

    // オブジェクトを代入した場合はその値がそのまま保持される
    var d = new Date(4545454);
    t.timeA = d;
    strictEqual(t.timeA, d);

    QUnit.start();
});

QUnit.asyncTest("LIST 型のフィールドを指定すると自動的に setter/getter が生成される", function () {
    var ListEntity = modules.Entity({
        name : "listtest",
        fields : {
            listA : "LIST",
        },
    });

    var t = new ListEntity({ listA: "a,b,c" });
    // t.listA は単なる data property ではなく accessor property

    ok(typeof t.listA === "object");
    deepEqual(t.listA, ["a","b","c"]);

    // setter なので, 単なる文字列を代入しても配列に変換される
    t.listA = "d,e,f";
    deepEqual(t.listA, ["d","e","f"]);

    // オブジェクトを代入した場合はその値がそのまま保持される
    var obj = ["1","3"];
    t.listA = obj;
    strictEqual(t.listA, obj);

    QUnit.start();
});

QUnit.asyncTest("自動的に生成された setter/getter が複数個存在しても問題ない", function () {
    var TestEntity = modules.Entity({
        name : "testtest",
        fields : {
            listA : "LIST",
            timeA : "TIMESTAMP",
            listB : "LIST",
            timeB : "TIMESTAMP",
        },
    });

    var t = new TestEntity({ listA: "a,b,c", listB: "1,2,3", timeA: 7000000, timeB: 6000000 });

    deepEqual(t.listA, ["a","b","c"]);
    deepEqual(t.listB, ["1","2","3"]);
    strictEqual(t.timeA.getTime(), 7000000);
    strictEqual(t.timeB.getTime(), 6000000);

    var lA = ["la"];
    var lB = ["lb"];
    var tA = new Date(5000000);
    var tB = new Date(4000000);
    t.listA = lA;
    t.listB = lB;
    t.timeA = tA;
    t.timeB = tB;

    strictEqual(t.listA, lA);
    strictEqual(t.listB, lB);
    strictEqual(t.timeA, tA);
    strictEqual(t.timeB, tB);

    QUnit.start();
});

}).call(this);
