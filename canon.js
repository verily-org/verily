var url = require('url');
var enums = require('./enums');

// Express middleware for canonicalisation of URLs
// from www URLs to the canonical non-www (apex) URL equivalents.
// (c) 2014 Alex Greenland. MIT Licence.
module.exports = function() {
        
    // The canon should be called as early as possible.
    return function(req, res, next) {
        // req.host from Express returns just the hostname (no port number).
        // See: http://expressjs.com/api.html#req.host
        
        if (req.host === 'www.' + enums.production.hostname) {
            // A www-based URL, so redirect to apex.
            // Compose the expected canonical absolute URL.
            var productionUrlObject = enums.production;
            
            // req.url from Express returns the relative URL (path) after the hostname.
            productionUrlObject.pathname = req.url;
            
            var productionUrl = url.format(productionUrlObject);
            
            res.redirect(productionUrl);
            res.end();
        } else {
            // Everything is ok -- the URL is already canonical.
            next();
        }
    };
};