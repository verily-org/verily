// Node.js / browser support
var isNodeJS = false;
if (typeof exports === 'undefined') {
    exports = {};
}

if (typeof module !== 'undefined') {
    isNodeJS = true;
}

var path;

// normalized moment library access.
var normMoment;

if (isNodeJS) {
    pathHelper = require('path');
    normMoment = require('moment');
} else {
    document.addEventListener('DOMContentLoaded', function(e) {
        if (typeof moment !== 'undefined') {
           normMoment = moment; 
        }
    });
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
var normalizeTag = exports.normalizeTag = common.normalizeTag = exports.normalizeString = common.normalizeString = function(tag) {
    // Just remove apostrophes, don't replace them with '-'.
    // If after the first replace there is just 1 '-' at start or end, remove it, or if there are 2 or more hyphens (-), trim to 1 '-'.
    return tag.trim().toLowerCase().replace(/'/g, '').replace(/[\s/\\#.,_!@$£€%^?<>(){}\[\]&*+=:;"`~]+/g, '-').replace(/-{2,}/g, '-' ).replace(/(^-)?(-$)?/g, '');    
};

// Pretty paths for canonical URLs
var prettyPath = exports.prettyPath = common.prettyPath = function(data) {
    var path = data.path;
    var prefix = data.prefix;
    var postPrefix = data.postPrefix;
    if (isNodeJS && pathHelper && data.hasOwnProperty('req')) {
        if (data.sameLevel || !postPrefix) {
            path = pathHelper.dirname(data.req.path);
        } else {
            path = data.req.path;
        }
        
        if (prefix) {
            path = prefix + '/' + path;
        }
        
        if (postPrefix) {
            path += '/' + postPrefix;
        }
    }
    var returnPath;

    if (process.env.TEST) {
        returnPath = path + '/' + data.id;
    } else {
        returnPath = path + '/' + common.normalizeString(data.id + '-' + data.string);
    }
    return returnPath;
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

var challenge = {};

challenge.year = 2014;
challenge.month = 7;
challenge.startDate = 12;
challenge.endDate = 13;
challenge.startHour = 9;
challenge.endHour = 22;
challenge.minutes = challenge.seconds = challenge.msecs = 0;

exports.challenge = common.challenge = challenge;

var getChallengeStartMoment = function() {
    // For the start date.
    var challengeStartMoment = null;
    if (normMoment) {
        challengeStartMoment = normMoment.utc().year(challenge.year);
        challengeStartMoment.utc().month(challenge.month - 1);
        challengeStartMoment.utc().date(challenge.startDate);
        challengeStartMoment.utc().hour(challenge.startHour);
        challengeStartMoment.utc().minute(challenge.minutes);
        challengeStartMoment.utc().second(challenge.seconds);
        challengeStartMoment.utc().millisecond(challenge.msecs);
    }
    return challengeStartMoment;
};

var isNowAfterMoment = function(targetMoment) {
    var nowMoment = normMoment.utc();
    return nowMoment.isAfter(targetMoment);
}


// --- CHALLENGE PUBLISHED SETTING ---
// Automatic challenge publication at set challenge time.
// Set publishedOverride = true to publish challenge regardless.
var challengePublished = exports.challengePublished = common.challengePublished = function() {
    var publishedOverride = true;
    
    // var isAfter = false;
    
    // Automatic challenge publication.
    // if (normMoment) {
    //     // All in UTC.
    //     var challengeStartMoment = getChallengeStartMoment();
    //
    //     isAfter = isNowAfterMoment(challengeStartMoment);
    //     // console.log('now is after challenge start moment: ' + isAfter);
    // }
    
    // return isAfter || publishedOverride;
    return publishedOverride;
};

var challengeCountdown = exports.challengeCountdown = common.challengeCountdown = function() {
    var returner = '';
    if (normMoment) {
        var challengeStartMoment = getChallengeStartMoment();
        
        if (challengePublished()) {
            return 'has begun!';
        }
        
        // if (isNowAfterMoment(challengeStartMoment) && !challengePublished()) {
        //     // User's browser clock is probably wrong.
        //     // User's clock reports that now is after the challenge start time,
        //     // but the challenge has not actually started yet according to server time
        //     return 'starts soon';
        // }
                
        var fromNow = challengeStartMoment.fromNow();

        if (fromNow) {
            returner = 'starts ' + fromNow;
        }
    }
    return returner;
};

// Used at client and server side.
var validateDateTimeOccurred = exports.validateDateTimeOccurred = common.validateDateTimeOccurred = function(value, elemsParent, elemsIsArray, callback) {
    var error = null;
    var date = null;
    
    if (value && Object.prototype.toString.call(value) === '[object Array]') {
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
    }
    
    callback(error, date);
};

// Normally 117 characters to allow t.co linking of the resource.
// Ref: https://blog.twitter.com/2012/upcoming-tco-changes
// For Verily challenge, hashtag is #VerilyLive which takes up 11 additional characters. To counter for whitespace, rounding to 100.
var maxTitleLength = exports.maxTitleLength = common.maxTitleLength = 100;

var dayDefault = exports.dayDefault = common.dayDefault = function() {
    return "Day";
};

var monthDefault = exports.monthDefault = common.monthDefault = function() {
    return "Month";
};

var yearDefault = exports.yearDefault = common.yearDefault = function() {
    return "Year";
};

var hourDefault = exports.hourDefault = common.hourDefault = function() {
    return "Hours";
};

var minuteDefault = exports.minuteDefault = common.minuteDefault = function() {
    return "Minutes";
};

var secondDefault = exports.secondDefault = common.secondDefault = function() {
    return "Seconds";
};

var properUser = exports.properUser = common.properUser = function(req) {
    return !(req.user.type === 'provisional' && process.env.BLOCK_PROVISIONAL_USERS == 1) && req.user.active;
}

var isUserContentShow = exports.isUserContentShow = common.isUserContentShow = function(user) {
    return !(user.type === 'provisional' && process.env.HIDE_PROVISIONAL_USERS_CONTENT == 1);
}

var isItemShow = exports.isItemShow = common.isItemShow = function(item){
    return !(item.hasOwnProperty('show') && !item.show);
}
