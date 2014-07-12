var url = require('url');
var mode = require('./mode');
var enums = require('./enums');
var common = require('./static/js/common');

// Express middleware for canonicalisation of URLs
// from www URLs to the canonical non-www (apex) URL equivalents.
// (c) 2014 Alex Greenland. MIT Licence.
module.exports = function() {
    
        
    // The canon should be called as early as possible.
    return function(req, res, next) {        
        // req.url from Express returns the relative URL (path) after the hostname.
        var workingUrl = req.url;
        
        var crisis1Canon = function() {
            if (common.challengePublished()) {
                if (workingUrl === '/live' || workingUrl === '/verilylive' || workingUrl === '/challenge') {
                    workingUrl = '/crisis/1';
                } else {

                }
            } else {

            }

        };
    
        var slashCanon = function() {
            // Remove instances of multiple slashes where they feature twice or more.
            // Also remove a trailing slash.
            workingUrl = workingUrl.replace(/\/{2,}/g, '/').replace(/\/$/, '');
        };
        
        slashCanon();
        
        crisis1Canon();
    
        
        // req.host from Express returns just the hostname (no port number).
        // See: http://expressjs.com/api.html#req.host
        
        if (mode.isProduction) {
            // Running on production.
                
            if ((req.get('x-forwarded-proto') === 'http') || (req.host === 'www.' + enums.production.hostname)) {
                // An http or www-based URL, so redirect to apex.
                // Compose the expected canonical absolute URL.
                var productionUrlObject = enums.production;
            
                productionUrlObject.pathname = workingUrl;
            
                workingUrl = url.format(productionUrlObject);
                
            } else {
                // The URL is already canonical in terms of using HTTPS at the apex.
            }
        
        } else {
            // Running on development.

        }
        

        if (workingUrl !== req.url) {
            res.redirect(workingUrl);
            res.end();
        } else {
            next();
        }
        

    };
};