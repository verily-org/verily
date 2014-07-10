// Node.js / browser support
var isNodeJS = false;
if (typeof exports === 'undefined') {
    exports = {};
}

if (typeof module !== 'undefined') {
    isNodeJS = true;
}

// Common namespace for browsers
var common = {};




// --- CHALLENGE ACTIVE SETTING ---
// Set to true to enable challenge active mode
// so that the routes are requestable.
// This is a function so we can return a boolean
// based on the current date being within a set date range, for example.
var challengeActive = exports.challengeActive = common.challengeActive = function() {
    return true;
}


var formAbsoluteURI = exports.formAbsoluteURI = common.formAbsoluteURI = function(path, options) {
    if (isNodeJS) {
        var url = require('url');
        
        if (!options) {
            options = require('../../enums.json').options;
        }
        
        if (path) {
            options.pathname = path;
        }
        
        return url.format(options);
    }
}

var tagize = exports.tagize = common.tagize = function(string) {
    return splitIntoTags(string).map(normalizeTag);
};



var campaign = exports.campaign = common.campaign = function() {
    var campaigns = {
        trial: 'VerilyTrial',
        main: 'VerilyLive'
    }
    return campaigns.main;
}

var campaigner = exports.campaigner = common.campaigner = function(medium, text, link) {    
    if (medium === 'twitter') {
        return {
            hashtags: campaign()
        };
    } else if (medium === 'email') {
        return {
            subject: text + ' #' + campaign(),
            body: text + ' – ' +  link + ' %0D%0A%0D%0AAnswer this with Verily, a crowdsourced verification platform.'
        };
    }
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
var validateVideoImage = exports.validateVideoImage = common.validateVideoImage = function(values, elemsParent, elemsIsArray, callback) {
    var error = null,
        i = 0;
    console.log(values);
    for(var key in values){
        if(values[key].length > 0){
            i++;
        }
    }
    if(i > 1){
        error = 'Please submit only 1 piece of evidence! (video or image)';
    }

    callback(error, values);
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
var validateURL = exports.validateURL = common.validateURL = function(value, callback) {

    var error = null;
    var reg_exp = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

    if (!reg_exp.test(value)) {
        error = 'provide a valid URL!';
    }

    callback(error, value);
};
var validateComment = exports.validateComment = common.validateComment = function(value, callback) {
    var error = null;

    if (value.length <= 3) {
        error = 'write some more!';
    }

    callback(error, value);
};

// --- CHALLENGE PUBLISHED SETTING ---
var challengePublished = exports.challengePublished = common.challengePublished = function() {
    return false;
}

// Used at client and server side.
var validateDateTimeOccurred = exports.validateDateTimeOccurred = common.validateDateTimeOccurred = function(value, elemsParent, elemsIsArray, callback) {
    var error = null;
    var date = null;
    
    // We are dealing with an array of values (dd, mm, yyyy, h, m, s)
    var day = value[0];
    var month = value[1];
    var year = value[2];
    var hour = value[3];
    var minute = value[4];
    // var second = value[5];
            
    // If they didn't select a date at all, that's fine -- the date is optional.
    if (day !== common.dayDefault() ||
        month !== common.monthDefault() ||
        year !== common.yearDefault() ||
        hour !== common.hourDefault() ||
        minute !== common.minuteDefault()) {
        // second !== common.secondDefault()) {
            // There is at least one field not set to its default (placeholder), so
            // try to construct a date object.
            
            day = parseInt(day);
            month = parseInt(month);
            year = parseInt(year);
            hour = parseInt(hour);
            minute = parseInt(minute);
            // second = parseInt(second);
            
            // Try to construct a date object out of these fields' values.
            // var date = new Date(year, month, day, hour, minute, second);
            date = new Date();
            date.setUTCFullYear(year);
            date.setUTCMonth(month - 1);
            date.setUTCDate(day);
            date.setUTCHours(hour);
            date.setUTCMinutes(minute);
            // date.setUTCSeconds(second);
                    
            if (isNaN(date.getTime()) || date.getUTCDate() !== day || date.getUTCMonth() + 1 !== month || date.getUTCFullYear() !== year || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute) {
             // date.getUTCSeconds() !== second) {
                // Invalid date.
                error = 'not valid!';
            }
        }
    
    callback(error, date);
};

// Normally 117 characters to allow t.co linking of the resource.
// Ref: https://blog.twitter.com/2012/upcoming-tco-changes
// For Verily challenge, hashtag is #VerilyLive which takes up 11 additional characters. To counter for whitespace, rounding to 100.
var maxTitleLength = exports.maxTitleLength = common.maxTitleLength = 100;

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

var properUser = exports.properUser = common.properUser = function(req) {
    return (req.user.type !== 'provisional' || process.env.BLOCK_PROVISIONAL_USERS == 0) && req.user.active;
}

