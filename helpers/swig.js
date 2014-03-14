var utils = require('utilities');
var common = require('../static/js/common');

module.exports = function(swig) {
    swig.setFilter('isUpvotedBy', function( answer, user) {
        var isUpvoted =answer.post.isUpvotedBy(user);
        return isUpvoted;
    });
    swig.setFilter('isDownvotedBy', function( answer, user) {
        var isDownvoted =answer.post.isDownvotedBy(user);
        return isDownvoted;
    });
    swig.setFilter('relativeTime', function(input, abbreviated) {
        utils.date.relativeTime(input);
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
};