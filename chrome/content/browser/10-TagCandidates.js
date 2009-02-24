const EXPORT = ["TagCandidates"];

function TagCandidates() {
    this._tags = null;
}

extend(TagCandidates.prototype, {
    getTagFragment: function TC_getTagFragment(input) {
        let start = input.lastIndexOf("[");
        return (start !== -1 && input.indexOf("]", start + 1) === -1)
            ? input.substring(start + 1) : null;
    },

    // XXX とりあえずナイーブに。
    // 他の案としてはfragmentが前回の文字列 + 数文字なら
    // 前回の結果から絞り込むとか。
    find: function TC_find(fragment) {
        let tags = this.tags;
        let start, end;

        let lower = 0, upper = tags.length - 1;
        while (lower < upper) {
            let middle = (lower + upper) >> 1;
            if (tags[middle] < fragment) {
                lower = middle + 1;
            } else {
                upper = middle;
                if (tags[middle] === fragment) break;
            }
        }
        start = upper;

        fragment = fragment.substring(0, fragment.length - 1) +
            String.fromCharCode(fragment.charCodeAt(fragment.length - 1) + 1);
        lower = start;
        upper = tags.length - 1;
        while (lower < upper) {
            let middle = (lower + upper) >> 1;
            if (tags[middle] < fragment) {
                lower = middle + 1;
            } else {
                upper = middle;
                if (tags[middle] === fragment) break;
            }
        }
        end = upper;

        return tags.slice(start, end);
    },

    // XXX ToDo: タグが追加削除されたらキャッシュをクリア。
    get tags TC_get_tags() {
        if (!this._tags) {
            this._tags = Model.Tag.findDistinctTags()
                              .map(function (t) t.name).sort();
        }
        return this._tags;
    }
});
