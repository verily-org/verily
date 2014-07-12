var url = require('url');
var mode = require('./mode');
var enums = require('./enums');
var common = require('./static/js/common');

// Express middleware for canonicalisation of URLs
// from www URLs to the canonical non-www (apex) URL equivalents.
// (c) 2014 Alex Greenland. MIT Licence.
module.exports = function() {
    
    var crisis1Canon = function(req, res, next) {
        if (common.challengePublished()) {
            if (req.url === '/live' || req.url === '/verilylive' || req.url === '/challenge') {
                res.redirect('/crisis/1');
            } else {
                next();
            }
        } else {
            next();
        }

    };
    
    var removeExtraSlashes = function(req, res, path) {
        // Remove instances of multiple slashes where they feature twice or more.
        var pathWithExtraSlashesRemoved = path.replace(/\/{2,}/, '/');
        
        if (path !== pathWithExtraSlashesRemoved) {
            // If slashes were removed, redirect to the canonical path.
            res.redirect(productionUrl);
            res.end();
        }
    };
        
    // The canon should be called as early as possible.
    return function(req, res, next) {
        // req.host from Express returns just the hostname (no port number).
        // See: http://expressjs.com/api.html#req.host
        
        if (mode.isProduction) {
            // Running on production.
                
            if ((req.get('x-forwarded-proto') === 'http') || (req.host === 'www.' + enums.production.hostname)) {
                // An http or www-based URL, so redirect to apex.
                // Compose the expected canonical absolute URL.
                var productionUrlObject = enums.production;
            
                // req.url from Express returns the relative URL (path) after the hostname.
                productionUrlObject.pathname = req.url;
            
                var productionUrl = url.format(productionUrlObject);
                
                removeExtraSlashes(req, res, productionUrl);
            
            } else {
                // The URL is already canonical in terms of using HTTPS at the apex.
                
                removeExtraSlashes(req, res, productionUrl);
                
                crisis1Canon(req, res, next);
            }
        
        } else {
            // Running on development.
            
            removeExtraSlashes(req, res, productionUrl);
            
            // The URL is already canonical in terms of using HTTPS at the apex.
            crisis1Canon(req, res, next);
        }
        

        
        
        



    };
};