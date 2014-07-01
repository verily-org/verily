// Reference: Adapted by Alex from https://github.com/visionmedia/connect-redis/blob/master/lib/connect-redis.js
/*!
 * Connect - Redis
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * One day in seconds.
 */

var oneDay = 86400;

// For persistent sessions using node-orm2
module.exports = function(connect) {
    
    var Store = connect.session.Store;
    
    var syncedModels;
        
    function ORMSessionStore(models, options) {
        var self = this;
        options = options || {};
        
        syncedModels = models;
                
        this.ttl = options.ttl;
    }
    
    // Inherit from connect Store
    ORMSessionStore.prototype.__proto__ = Store.prototype;
    
    // Get a session identified by session id.
    ORMSessionStore.prototype.get = function(sid, callback) {
        syncedModels.Session.find({
            sid: sid
        }, 1, function(err, results) {
            if (err) {
                return callback(err);
            }
            
            if (!results || results.length === 0) {
                console.log('returning as no results')
                return callback();
            }
                    
            var parsed;
            var result = results[0];
            var value = result.value.toString();
            
            try {
                parsed = JSON.parse(value);
            } catch (err) {
                return callback(err);
            }
            
            return callback(null, parsed);
            
            
        });
    };
    
    // Set session identified by session id.
    ORMSessionStore.prototype.set = function(sid, sess, callback) {
        var maxAge = sess.cookie.maxAge;
        var ttl = this.ttl;
        
        ttl = ttl || ('number' == typeof maxAge
            ? maxAge / 1000 | 0
            : oneDay);
            
        sess.ttl = ttl;
            
        var sess = JSON.stringify(sess);
            
        syncedModels.Session.find({
            sid: sid
        }, 1, function(err, results) {
            if (results && results.length !== 0 && results[0]) {
                // This session is already stored in the database,
                // update it.
                var instance = results[0];
                instance.value = sess;
                instance.save(function (err) {
                    if (err) {
                        callback && callback(err);
                    } else {
                        callback && callback.apply(this, arguments);
                    }
                });
                
                
            } else {
                // This session not yet stored in the database,
                // create it.
                syncedModels.Session.create({
                    sid: sid,
                    value: sess
                }, function (err, results) {
                    if (err) {
                        callback && callback(err);
                    } else {
                        callback && callback.apply(this, arguments);
                    }
                });
            }
            
        });



    };
    
    // Destroy session identified by session id.
    ORMSessionStore.prototype.destroy = function(sid, callback) {
        syncedModels.Session.find({
            sid: sid
        }, 1).remove(function(err) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        })
    };
    
    
    return ORMSessionStore;
    
};