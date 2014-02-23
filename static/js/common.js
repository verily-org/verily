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
    // If after the first replace there is just 1 '-' at start or end, remove it, or if there are 2 or more hyphens (-), trim to 1 '-'.
    return tag.trim().toLowerCase().replace(/'/g, '').replace(/[\s/\\#._!@$£€%^?<>{}\[\]&*+=:;"`~]+/g, '-').replace(/-{2,}/g, '-' ).replace(/(^-)?(-$)?/g, '');    
};


var getYears = exports.getYears = common.getYears = function() {
    var now = new Date();
    var currentYear = now.getFullYear();
    var years = [];
    
    for (var i = currentYear; i > currentYear - 101; i--) {
        years.push(i);
    }
    return years;
};

var getAllFromRange = exports.getAllFromRange = common.getAllFromRange = function(start, end, format) {
    var returner = [];
    var pad = Number.MAX_VALUE;
    
    if (format === 'padding') {
        pad = 10;
    }
        
    // Zero padding.
    for (var i = start; i < pad && i <= end; i++) {
        returner.push('0' + i.toString());
    }
    
    // We have done padding, so start iterating at value of pad.
    if (pad !== Number.MAX_VALUE) {    
        for (var i = pad; i <= end; i++) {
            returner.push(i.toString());
        }
    }
    
    return returner;
    
};