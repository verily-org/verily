var generic = require('../controllers/generic');
var utils = require('utilities');
var mode = require('../mode');
var common = require('../static/js/common');

module.exports = function(swig) {
    
    // swig.setFilter('canViewChallengePages', function() {
    //
    // })
    
    swig.setFilter('isAdmin', function() {
        return generic.isAdmin();
    });
    
    swig.setFilter('isProduction', function() {
        return mode.isProduction();
    });
    
    swig.setFilter('challengeActive', function() {
        return common.challengeActive();
    });
    
    swig.setFilter('challengePublished', function() {
        return common.challengePublished();
    });
    
    swig.setFilter('challengeCountdown', function() {
        return common.challengeCountdown();
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
    
    swig.setFilter('styleYesesNoes', function(yeses, noes, target, element) {
        var total = yeses + noes;
        // console.log('values:', yeses + ';' + noes);
        // console.log('total:', total);
        
        var minimum = 18.5;
        var maximum = 81.5;
        
        var returner;
        
        if (target === 'yes') {
            returner = yeses;
        } else {
            returner = noes;
        }
        
        var percentage  = (returner / total) * 100;
        percentage = percentage.toFixed(0);
        
        if (total === 0) {
            returner = '0';
            
            if (element === 'progress-bar-width') {
                returner = '50%';
            } else if (element === 'progress-bar-class') {
                returner = 'progress-bar-transparent';
            }
            
        } else {
            // Do clipping and minimums.
            if (percentage > maximum) {
                // All responses of one type,
                // clip to 90% to show other type.
                percentage = maximum;
            } else if (percentage < minimum) {
                // The other type: no responses,
                // make a minimum of 10%.
                percentage = minimum;
            }
            
                
            if (element === 'progress-bar-width') {
                returner = percentage + '%';
                
            } else if (element === 'progress-bar-class') {
                if (returner === 0) {
                    returner = 'progress-bar-transparent';
                } else {
                    if (target === 'yes') {
                        returner = 'progress-bar-success';
                    } else {
                        returner = 'progress-bar-danger';
                    }
                
                }
            }
        }
        
        
        return returner;
    });

    swig.setFilter('cropString', function(string, limit) {
        if(string != null){
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
        }
        return string;
    });
};