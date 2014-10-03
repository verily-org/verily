var sanitizer = require('sanitizer'),
    validator = require('validator');

// Express middleware for sanitization and validation
// of all request data.
// (c) 2014 Alex Greenland. MIT Licence.
module.exports = function() {
    
    // Recursive cleaning function.
    var cleanValue = function(value) {
        if (Array.isArray(value)) {
            // The value is an array. Clean each array element individually.
            var cleanedArray = value.map(function(elem) {
                // Recursive call.
                return cleanValue(elem);
            });
            return cleanedArray;
        } else {
            // String (this is the base case), so sanitize then escape.
            var cleaned = validator.escape(sanitizer.sanitize(value));
            
            // Convert hex-encoded apostrophe to decimal-encoded apostrophe;
            // convert escaped ampersand to name-encoded ampersand.
            cleaned = cleaned.replace(/&#x27;/g, '&#39;').replace(/&amp;amp;/g, '&amp;');
            
            return cleaned;
        }
    };
    
    // Cleans a key and the key's value within an object.
    var cleanObjectProperty = function(oldObject, newObject, key) {
        var cleanedKey = cleanValue(key);
        
        newObject[cleanedKey] = cleanValue(oldObject[key]);
        return newObject;
    }
    
    // The cleaner must be called as soon as possible,
    // and ensure before the router and impression/analytics handling.
    return function(req, res, next) {    
        var newReqQuery = {};
        var newReqBody = {};
        
        // Clean the querystring.
        if (req.query) {            
            Object.keys(req.query).forEach(function(item) {
                newReqQuery = cleanObjectProperty(req.query, newReqQuery, item);
            });
            
            // Set the req.query object to the cleaned object
            // so that it is passed on appropriately to next layer.
            delete req.query;
            req.query = newReqQuery;
        }

        // Clean the path.
        req.path = cleanValue(req.path);
        
        // Clean the body.
        if (req.body) {
            Object.keys(req.body).forEach(function(item) {
                newReqBody = cleanObjectProperty(req.body, newReqBody, item);
            });
                        
            // Set the req.body object to the cleaned object 
            // so that it is passed on appropriately to next layer.
            delete req.body;
            req.body = newReqBody;
        
            
        }
        
        
        next();
    };
};