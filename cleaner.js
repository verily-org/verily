var sanitizer = require('sanitizer'),
    validator = require('validator');

// Express middleware for sanitization and validation
// of all request data.
// (c) 2014 Alex Greenland. MIT Licence.
module.exports = function() {
    
    // Recursive cleaning function.
    var cleanValue = function(value) {
        if (validator.isNull(value) || validator.isNumeric(value) || validator.isDate(value)) {
            // Null string, valid numeric value or valid date value.
            return value;
        } else if (Array.isArray(value)) {
            // The value is an array. Clean each array element individually.
            var cleanedArray = value.map(function(elem) {
                // Recursive call.
                return cleanValue(elem);
            });
            return cleanedArray;
        } else {
            // String (this is the base case), so sanitize then escape.
            return validator.escape(sanitizer.sanitize(value));
        }
    };
    
    // Cleans a key and the key's value within an object.
    var cleanObjectProperty = function(oldObject, newObject, key) {
        newObject[cleanValue(key)] = cleanValue(oldObject[key]);
    }
    
    // The cleaner must be called as soon as possible,
    // before any other middleware and before the router.
    return function(req, res, next) {
        console.log('Cleaner request: ' + req.path)
        
        var newReqQuery = {};
        var newReqBody = {};
        
        // Clean the querystring.
        if (req.query) {            
            Object.keys(req.query).forEach(function(item) {
                cleanObjectProperty(req.query, newReqQuery, item);
            });
            
            // Set the req.query object to the cleaned object
            // so that it is passed on appropriately to next layer.
            req.query = newReqQuery;
        }

        // Clean the path.
        req.path = cleanValue(req.path);
        
        // Clean the body.
        if (req.body) {            
            Object.keys(req.body).forEach(function(item) {
                cleanObjectProperty(req.body, newReqBody, item);
            });
                        
            // Set the req.body object to the cleaned object 
            // so that it is passed on appropriately to next layer.
            req.body = newReqBody;
            
        }
        next();
    };
};