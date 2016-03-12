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

var checkColumn = function(db, table, column, cb)
{
    switch(db.driver_name)
    {
        case 'sqlite':
            db.driver.execQuery("PRAGMA table_info("+table+")", function(err, res) {
                if(err) {
                    cb(err, res); 
                    return;
                }
                var exists = res.filter(function(i) { return i.name == column; })
                cb(err, exists.length > 0);
            });
            break;
        case 'postgres':
            db.driver.execQuery("SELECT COUNT(*) as col_exists FROM information_schema.columns \n\
WHERE table_name=? and column_name=?", [table, column], function(err, res) {
            if(err) {
                cb(err, res);
                return;
            }
            cb(err, res[0].col_exists);
        });
            break;
        default:
            throw "Unhandled db driver";
    }
}

exports.analytics = function(req, res) {
    try {
        req.db.models.config.get("time", function(err, analytics_time) {
            res.send(JSON.stringify({ time: analytics_time}));
        });
        
    } catch(e)
    {
        res.send(JSON.stringify({err: e}));
    }
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