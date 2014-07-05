var utils = require('utilities');
var mode = require('../mode');
var common = require('../static/js/common');

module.exports = function(swig) {
    
    swig.setFilter('isProduction', function() {
        return mode.isProduction();
    });
    
    swig.setFilter('challengeActive', function() {
        return common.challengeActive();
    });
    
    swig.setFilter('isMarkedImportantBy', function( post, user) {
        var isMarkedAsImportant = post.isMarkedImportantBy(user);
        return isMarkedAsImportant;
    });
    swig.setFilter('isUpvotedBy', function( answer, user) {
        var isUpvoted = answer.post.isUpvotedBy(user);
        return isUpvoted;
    });
    swig.setFilter('isDownvotedBy', function( answer, user) {
        var isDownvoted =answer.post.isDownvotedBy(user);
        return isDownvoted;
    });
    swig.setFilter('relativeTime', function(input, abbreviated) {
        //used this because if the input is not a date the application crashes
        if(input instanceof Date)
            return utils.date.relativeTime(input, {abbreviated: true});
    });
    
    swig.setFilter('getMaxTitleLength', function() {
        return common.getMaxTitleLength();
    });
    
    swig.setFilter('getYears', function() {
        return common.getYears();
    });
    
    swig.setFilter('getAllFromRange', function(start, end, padding) {
        return common.getAllFromRange(start, end, padding);
    });
    
    swig.setFilter('getDayDefault', function() {
        return common.dayDefault();
    });
    
    swig.setFilter('getMonthDefault', function() {
        return common.monthDefault();
    });
    
    swig.setFilter('getYearDefault', function() {
        return common.yearDefault();
    });
    
    swig.setFilter('getHourDefault', function() {
        return common.hourDefault();
    });
    
    swig.setFilter('getMinuteDefault', function() {
        return common.minuteDefault();
    });

    swig.setFilter('getSecondDefault', function() {
        return common.secondDefault();
    });

    swig.setFilter('length', function(array) {
        return array.length;
    });

    swig.setFilter('cropString', function(string, limit) {
        if(string.length > limit){
            var i = limit-1;
            while(i < string.length){
                if(string[i] == ' '){
                    return string.substring(0, i) + '...';
                    break;
                }
                i++;
            }
        }
        return string;
    });
};