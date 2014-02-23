var utils = require('utilities');
var common = require('../static/js/common');

module.exports = function(swig) {
    swig.setFilter('relativeTime', function(input, abbreviated) {
        utils.date.relativeTime(input);
    });
    
    swig.setFilter('getYears', function() {
        return common.getYears();
    });
    
    swig.setFilter('getAllFromRange', function(start, end, padding) {
        return common.getAllFromRange(start, end, padding);
    });
};