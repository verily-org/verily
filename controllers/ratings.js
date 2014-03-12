var generic = require('./generic');
var enums = require('../enums');
var swig = require('swig');
var async = require('async');
var utils = require('utilities');

var common = require('../static/js/common');

var role = require('../lib/roles').user;

//get rating types = ratingModel.allProperties.type.values

exports.downvote = function (req, post, cb) {
    var downvote_string = "downvote";
    var user = req.user;

    addOrUpdateRating(req, post, downvote_string, function(err, rating){
        return cb(err, rating);
    });
};

exports.upvote = function (req, post, cb) {
    var upvote_string = "upvote";
    var user = req.user;

    addOrUpdateRating(req, post, upvote_string, function(err, rating){
        return cb(err, rating);
    });
};

exports.importance = function (req, post, cb) {
    var importance_string = "importance";
    var user = req.user;

    addOrUpdateRating(req, post, importance_string, function(err, rating){
        return cb(err, rating);
    });
};
var getExistingRating = function(ratingModel, user, post, type, cb){
    var search_criteria = {};
    if(user != null){
        search_criteria = { user: user, post: post};
    }
    else{
        //todo add mecanism to save unique votes from non users or give feedback to sing in (before)
        search_criteria = {post: post};
    }
    if(type == "upvote" || type == "downvote"){
        search_criteria.type = ["upvote" , "downvote"];
        ratingModel.find(search_criteria, function(err, ratings){
            var single_rating =  ratings[0];//ratings.filter(function(rating){return rating.isUpvote() || rating.isDownvote()});
            if(!err && single_rating != undefined){
                return cb(single_rating);
            }
            else{
                return cb();
            }
        });
    }
    else if(type == "importance"){
        search_criteria.type = "importance";
        ratingModel.find(search_criteria, function(err, ratings){
            var single_rating = ratings[0];
            if(!err && single_rating != undefined){
                return cb(single_rating);
            }
            else{
                return cb();
            }
        });
    }
}
var addOrUpdateRating = function (req, post, type, cb) {
    var ratingModel = req.models.Rating;
    var user = req.user;
    getExistingRating(ratingModel, user, post, type, function(rating){
        if(rating != undefined){
            //update rating
            rating.type = type;
            rating.save(function(err){
                return cb(err, rating);
            });
        }
        else{
            //add new rating
            ratingModel.create([{user: user, post: post, type: type}], function(err, items){
                return cb(err, items[0]);
            });
        }
    });
};
