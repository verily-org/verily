// Node.js / browser support
if (typeof exports === 'undefined') {
    exports = {};
}

// Common namespace for browsers
var common = {};

var tagize = exports.tagize = common.tagize = function(string) {
    return splitIntoTags(string).map(normalizeTag);
};


var splitIntoTags = exports.splitIntoTags = common.splitIntoTags = function(string) {
    return string.split(',').filter(function(tag) {
        // Do not include just whitespace elements.
        if (tag && !(/^\s+$/.test(tag))) {
            return tag;
        }

    });
};

// Make tags friendly for URIs.
// Replace multiple instances of whitespace with '-'.
// e.g. turn " " into "-".
var normalizeTag = exports.normalizeTag = common.normalizeTag = function(tag) {
    // Just remove apostrophes, don't replace them with '-'.
    // If after the first replace there is just one '-' at start or end, remove it.
    return tag.trim().toLowerCase().replace(/'/g, '').replace(/[\s/\\#._!@$£€%^?<>{}\[\]&*+=:;"`~]+/g, '-').replace(/(^-)|(-$)/, '');
};