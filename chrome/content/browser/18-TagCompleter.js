
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
            // wow
            return null;
        }
        return val;
    },
    migemoSuggest: function(word) {
        let regex = new RegExp(XMigemoTextUtils.getANDFindRegExpFromTerms(XMigemoCore.getRegExps(word, 'gi')));
        let words = [];
        let suggestTags = this.suggestTags;
        for (let i = 0, len = suggestTags.length;  i < len; i++) {
            let tKey = suggestTags[i];
            if (regex.test(tKey))
                words.push(tKey);
            if (words.length >= limit) break;
        }
        return words;
    },
    suggest: function(pos) {
        let word = this.posWord(pos);
        if (word === null) return [];
        
        if (this.migemo) {
            return this.migemoSuggest(word);
        } 

        let limit = this.maxSuggest;
        let words = [];
        let w = word.toUpperCase();
        let spaceMatched = function(tKey, index, ws, first) {
            if (ws.length == 0) return true;
            let i;
            if (((i = tKey.indexOf(ws.shift(), index)) >= 0) && !(first && i != 0)) {
                return spaceMatched(tKey, i+2, ws, false);
            }
            return false;
        }

        let sep = w.split(/\s+/);
        let ws = [];
        for (let i = 0;  i < sep.length; i++) {
            if (sep[i]) ws.push(sep[i]);
        }

        let suggestTags = this.suggestTags;
        for (let i = 0, len = suggestTags.length;  i < len; i++) {

            let tKey = suggestTags[i];
            if (spaceMatched(tKey.toUpperCase(), 0, Array.prototype.slice.apply(ws), true)) {
                words.push(tKey);
            }
            if (words.length >= limit) break;
        }
        return words;

    },
    insertionTag: function(tagName, pos) {
        let value = this.value;
        let prefix = value.substring(0, pos);
        let suffix = value.substring(pos);
        let lPos = prefix.lastIndexOf('[');
        if (lPos == -1) return false;
        prefix = prefix.substring(0, lPos + 1) + tagName + ']';
        this.value = prefix + suffix;
        return prefix.length;
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


