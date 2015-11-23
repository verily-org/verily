var query = require('../lib/sqlQueries');
var orm = require('orm');
var async = require('async');
exports.csrf = function(req, res) {
	require('http');
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.render("api/api");
}
exports.isLoggedIn = function(req, res) {
	var resp="NO";	
	if(req.user) resp = "YES";
	res.render("api/response", {"resp" : resp});
}
exports.allCrisises = function(req,res) {
    query.findAllCrisisNames(req, function(err, crisises) {
        var resp = {
            "crises" : crisises
        };
        res.send(JSON.stringify(resp));
    });
}

exports.analytics = function(req, res) {
    var _collectNewTags = function(req, since, cb) {
        req.models.Post.find( {updated: orm.gt(since)}, function(err, posts) {
            async.eachSeries(posts, function(post, _cb) {
                var externTags = [];
                try{
                        async.eachSeries(post.tags, function(tag, __cb) {
                            req.models.Tags.exists( {tag_name: tag}, function(err, exists) {
                                if(!exists) {
                                    req.models.Tags.create([{ tag_name: tag }], function(err, tag) {
                                        externTags.push(tag[0]); 
                                        __cb();
                                    });
                                } else {
                                    req.models.Tags.find({tag_name: tag}, function(err, tag) {
                                        externTags.push(tag[0]); 
                                        __cb();
                                    });
                                }
                            } );   
                        }, function() {post.setExternTags(externTags).save(); _cb();});
                            
                    } catch(e) {
                        _cb();
                    };
            }, cb);       
                
        } );
        
    };
    var last_analytics_time = "0";
    req.models.Config.exists( {attr: "analytics_time"}, function(err, exists) {
        if(exists)
        {
            req.models.Config.get("analytics_time", function(err, conf) {
                last_analytics_time = conf.val;
                _collectNewTags(req, last_analytics_time, function(tags, err){
                        if(err) res.send(err); else 
                        res.send("ok");
                    });
                conf.val = new Date().toISOString();
                conf.save(function(err) {});
                
            });
            
        }
         else 
         {
             _collectNewTags(req, last_analytics_time, function(tags, err){
                        res.send(JSON.stringify(tags));
                    });
             req.models.Config.create([ {attr: "analytics_time", val: new Date().toISOString()} ], function(err, items) {});
         }
    } );
}

exports.tags = function(req, res) {
    if(req.query.q.length < 3) 
    {
        res.send("[]");
        return;
    }
    
    query.getMatchedTags(req, "%"+req.query.q+"%", function(err, items) {
        res.send(JSON.stringify(items));
    });
}
exports.newsStatistic = function(req, res) {
    if(!req.user) {
        res.send(JSON.stringify({newsCrises: 0, newsTags: 0}));
        return;
    }
    query.getNewsCount(req, function(err, stat) {
        res.send(JSON.stringify(stat));
    });
}