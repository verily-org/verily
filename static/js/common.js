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
        var item = i.toString();
        if (format === 'padding') {
            returner.push('0' + item);
        } else {
            returner.push(item);
        }
    }
        
    if (format === 'padding') {
        // We have done padding, so start iterating at value of pad.
        for (var i = pad; i <= end; i++) {
            returner.push(i.toString());
        }
    }
    
    return returner;
};

// maxTitleLength defined in generic/title-chars-left.html
// @return boolean: true for valid
var validateFormTitle = exports.validateFormTitle = common.validateFormTitle = function(value, elemsParent, elemsIsArray, callback) {
    var error = null;
    
    if (value.length === 0) {
        error = 'need one!';
    } else if (value.length > common.maxTitleLength) {
        error = 'too long!';
    }
    
    callback(error, value);
};

// Used at client and server side.
var validateDateTimeOccurred = exports.validateDateTimeOccurred = common.validateDateTimeOccurred = function(value, elemsParent, elemsIsArray, callback) {
    var error = null;
    var date = new Date();
    
    // We are dealing with an array of values (dd, mm, yyyy, h, m, s)
    var day = value[0];
    var month = value[1];
    var year = value[2];
    var hour = value[3];
    var minute = value[4];
    var second = value[5];
            
    // If they didn't select a date at all, that's fine -- the date is optional.
    if (day !== common.dayDefault() ||
        month !== common.monthDefault() ||
        year !== common.yearDefault() ||
        hour !== common.hourDefault() ||
        minute !== common.minuteDefault() ||
        second !== common.secondDefault()) {
            // There is at least one field not set to its default (placeholder), so:
            
            day = parseInt(day);
            month = parseInt(month);
            year = parseInt(year);
            hour = parseInt(hour);
            minute = parseInt(minute);
            second = parseInt(second);
            
            // Try to construct a date object out of these fields' values.
            // var date = new Date(year, month, day, hour, minute, second);
            date.setUTCFullYear(year);
            date.setUTCMonth(month - 1);
            date.setUTCDate(day);
            date.setUTCHours(hour);
            date.setUTCMinutes(minute);
            date.setUTCSeconds(second);
                    
            if (isNaN(date.getTime()) || date.getUTCDate() !== day || date.getUTCMonth() + 1 !== month || date.getUTCFullYear() !== year || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) {
                // Invalid date.
                error = 'not valid!';
            }
        }
    
    callback(error, date);
};

// TODO may want this to be <140 to allow linking of the resource.
var maxTitleLength = exports.maxTitleLength = common.maxTitleLength = 140;

var dayDefault = exports.dayDefault = common.dayDefault = function() {
    return "Day";
}

var monthDefault = exports.monthDefault = common.monthDefault = function() {
    return "Month";
}

var yearDefault = exports.yearDefault = common.yearDefault = function() {
    return "Year";
}

var hourDefault = exports.hourDefault = common.hourDefault = function() {
    return "Hours";
}

var minuteDefault = exports.minuteDefault = common.minuteDefault = function() {
    return "Minutes";
}

var secondDefault = exports.secondDefault = common.secondDefault = function() {
    return "Seconds";
}

