
var EXPORT = ['TagCompleter'];

var TagCompleter = {
};

TagCompleter.InputLine = function(value, tags) {
    this.suggestTags = tags;
    this.value = value;
    this.maxSuggest = 10; // default
}

TagCompleter.InputLine.prototype = {
    get value() this._text,
    set value(val) {
        this._text = val;
    },
    addTag: function(tagName) {
        let val = this.value;
        let lastIndex = val.lastIndexOf(']');
        if (lastIndex == -1) {
            this.value = '[' + tagName + ']' + val;
        } else {
            let prefix = val.substring(0, lastIndex + 1);
            let suffix = val.substr(lastIndex + 1);
            this.value = prefix + '[' + tagName + ']' + suffix;
        }
        this.uniqTextTags();
    },
    deleteTag: function(tagName) {
        let [comment, tags] = this.cutoffComment(this.value);
        tags = tags.filter(function(t) tagName != t);
        this.updateByCommentTags(comment,tags);
    },
    posWord: function(pos) {
        let val = this.value;
        let lastIndex = val.lastIndexOf('[', pos);
        if (lastIndex >= pos) {
            return null;
        }
        let firstIndex = val.indexOf(']', pos);
        if (firstIndex < pos && (firstIndex != -1)) {
            return null;
        }
        val = val.substring(lastIndex + 1, pos);
        if (val.indexOf(']') != -1) {
            return null;
        }
        return val;

        // let lastPos = val.indexOf(']', firstPos);
    },
    suggest: function(pos) {
        let word = this.posWord(pos);
        if (word === null) return [];

        let limit = this.maxSuggest;
        var words = [];
        var w = word.toUpperCase();
        var spaceMatched = function(tKey, index, ws, first) {
            if (ws.length == 0) return true;
            var i;
            if (((i = tKey.indexOf(ws.shift(), index)) >= 0) && !(first && i != 0)) {
                return spaceMatched(tKey, i+2, ws, false);
            }
            return false;
        }

        var sep = w.split(/\s+/);
        var ws = [];
        for (var i = 0;  i < sep.length; i++) {
            if (sep[i]) ws.push(sep[i]);
        }

        let suggestTags = this.suggestTags;
        for (var i = 0, len = suggestTags.length;  i < len; i++) {

            var tKey = this.suggestTags[i];
            if (spaceMatched(tKey.toUpperCase(), 0, Array.prototype.slice.apply(ws), true)) {
                words.push(tKey);
            }
            if (words.length >= limit) break;
        }
        return words;

    },
    insertionTag: function(tagName, pos) {
    },
    updateByCommentTags: function(comment, tags) {
        let text = comment;
        if (tags.length) {
            text = '[' + tags.join('][') +']' + text;
        }
        this.value = text;
    },
    uniqTextTags: function() {
        // input の文字列がいきなりかわると嫌なので、明示的に行う
        let [comment, tags] = this.cutoffComment(this.value);
        this.updateByCommentTags(comment,tags);
    },
    cutoffComment: function(str) {
        let re = /\[([^\[\]]+)\]/g;
        let match;
        let tags = [];
        let lastIndex = 0;
        while ((match = re.exec(str))) {
            lastIndex += match[0].length; 
            //if (lastIndex == re.lastIndex) 
            let tag = match[1];
            if (!tags.some(function(t) tag == t))
                tags.push(match[1]);
        }
        let comment = str.substring(lastIndex) || '';
        return [comment, tags];
    },
}
