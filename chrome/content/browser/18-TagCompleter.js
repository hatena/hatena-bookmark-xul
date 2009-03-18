
var EXPORT = ['TagCompleter'];

var TagCompleter = {
};

TagCompleter.InputLine = function(value, tags) {
    this.suggestTags = tags;
    this.value = value;
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
            var prefix = val.substring(0, lastIndex + 1);
            var suffix = val.substr(lastIndex + 1);
            this.value = prefix + '[' + tagName + ']' + suffix;
        }
        this.uniqTextTags();
    },
    deleteTag: function(tagName) {
        let [comment, tags] = this.cutoffComment(this.value);
        tags = tags.filter(function(t) tagName != t);
        this.updateByCommentTags(comment,tags);
    },
    suggest: function(pos) {
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
