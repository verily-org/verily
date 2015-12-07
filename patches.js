var async = require('async');
var orm = require('orm');
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
};
var patches = [
    { id: "2015-12-06 14:22",
        patchStructure: function(db, callback)
        {
            console.log("Checking user.lastVisit column...");
            checkColumn(db,"user", "lastVisit", function(err, exists) {
                if(err) {
                    console.log("Errors while checking user.lastVisit column: "+err);
                    console.log("please add it manually");
                } else {
                    if(!exists) {
                        console.log("Haven't found. Adding column");
                        db.driver.execQuery("ALTER TABLE user ADD COLUMN lastVisit DATETIME", function(err, res)
                        {
                            if(err) {
                                console.log("Errors while adding user.lastVisit column: "+err);
                                console.log("please add it manually");
                            } else {
                                console.log("Adding column user.lastVisit ok");
                            }
                            callback();
                        });
                    } else {
                        console.log("Column already exists");
                        callback();
                    }
                }
            });
            
        },
        patchEntity: function(db, callback)
        {   
            var _collectNewTags = function(cb) {
                console.log("Initializing tags table...");

                db.models.post.find(function(err, posts) {
                    console.log("Found " + posts.length + "posts");
                    var allPosts = posts.length;
                    var processedPosts = 0;
                    var lastLoggetPercents = 0;
                    async.eachSeries(posts, function(post, _cb) {
                        var percentsDone = Math.round(processedPosts / allPosts * 100);
                        ++processedPosts;
                        if(percentsDone >= lastLoggetPercents + 10)
                        {
                            lastLoggetPercents = percentsDone;
                            console.log("Processed "+ percentsDone + "%");
                            
                        }
                        var externTags = [];
                        try{
                                async.eachSeries(post.tags, function(tag, __cb) {
                                    db.models.tag.exists({tag_name: tag}, function(err, exists) {
                                        if(!exists) {
                                            db.models.tag.create([{ tag_name: tag }], function(err, tag) {
                                                externTags.push(tag[0]); 
                                                __cb();
                                            });
                                        } else {
                                            db.models.tag.find({tag_name: tag}, function(err, tag) {
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
            db.models.post.sync(function(err) {
                db.models.tag.sync(function(err) {
                    _collectNewTags(callback);
                });
            });
            
            
        }
    }
    
];

var currVersion;

var onePatch = function(patch, patchFunc, db, cb)
{
    console.log("Found patch "+patch.id);
    console.log("Version "+ currVersion + (currVersion < patch.id ? " < " : " >= ") + patch.id);
    if(currVersion < patch.id)
    {
        console.log("Patching to "+patch.id+"...");
        patchFunc(db, function() {
            console.log("Patching to "+patch.id+" ok");
            currVersion = patch.id;
            cb();
        });
    }
}

exports.patch=function(db, version, cb) {
    currVersion = version;
    console.log("Patching db structure ...");
    async.eachSeries(patches, function(patch, _cb) {
        onePatch(patch, patch.patchStructure, db, _cb);
    }, function(err) {
        console.log("Patching structure ok");
        console.log("Patching db content");
        async.eachSeries(patches, function(patch, _cb) {
            currVersion = version;
            onePatch(patch, patch.patchEntity, db, _cb);
        }, function() {
            console.log("Patching ok");
            cb(currVersion);
        });
    });
}


