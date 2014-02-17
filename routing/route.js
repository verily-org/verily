// Local modules.
var enums = require('../enums'),
    utils = require('../utils'),
    fs = require('fs'),
    paths = require('path'),
    urls = require('url');

// Set up function, taking the express app.
module.exports = function (app, controllers, doc, filename) {
    // modularised filename
    // ex. questions.js => questions
    var module = paths.basename(filename, '.js');

    // Form a cURL command for examples in documentation. 
    function formCurlCommand(method, path, controllerFuncName, commentPart, insert) {
        var url = urls.format(enums.options),
            curlLines = '',
            curlCall = '',
            testFunc,
            result;
        if (commentPart) {
            // Add the comment as a bash comment.
            curlLines = '# ' + commentPart + '\n';
        }

        curlCall += 'curl -i ' + url;

        testFunc = require('../test/autotests/' + module)[controllerFuncName];
        if (testFunc) {
            result = testFunc(null, true);
            curlCall += result.path;

            if (method === 'put' || method === 'post') {
                if (method === 'put') {
                    curlCall += ' -X PUT';
                }
                // need to use the -d option.
                // Get example data from the associated test function.
                // ex. test/autotests/questions.js:create().
                curlCall += ' -d "' + utils.bodyEncode(result.data) + '"';
            } else if (method === 'head') {
                // need to use the -X PUT option.
                curlCall += ' -X HEAD';
            } else if (method === 'delete') {
                // need to use the -X DELETE option.
                curlCall += ' -X DELETE';
            }
        }

        curlLines += curlCall;

        insert.push('ex. ```' + curlCall + '```');

        return curlLines;
    }

    // Generated API Documentation
    // Documents an endpoint.
    function document(doc, method, path, controllerFuncName, comment) {
        // Array added to for docs of this endpoint.
        var insert = [],
            commentParts = comment.split(';'), // Comments are separated by ';'.
            i,
            curlCommand;

        // File containing curl commands in shell script.

        // Add the first comment as the heading.
        insert.push('### ' + commentParts[0]);

        // Add other comments.
        for (i = 1; i < commentParts.length; i = i + 1) {
            commentParts[i] = commentParts[i].trim();
            insert.push(commentParts[i]);
        }

        // Insert the syntax of the route.
        insert.push('    ' + method.toUpperCase() + ' ' + path);

        // Get the curl command and insert it into the docs.
        curlCommand = formCurlCommand(method, path, controllerFuncName, commentParts[1], insert);

        // Add to the doc the items separated by line breaks.
        doc.doc.push(insert.join('\n\n'));

        // Add to the demo the curl commands.
        doc.demo.push(curlCommand);
    }

    // Return a route function
    // which calls the express route
    // and adds to the API documentation.
    return function (method, path, controllerFuncName, comment) {
        if (app.hasOwnProperty(method)) {
            // Method (such as GET, PUT, POST, DELETE) exists for app.
            // Continue.

            // Call the controller function!
            // If function or module doesn't exist then 
            // gracefully ignore – don't add to express app, but still document
            // in API as it may be a todo.
            if (controllers.hasOwnProperty(module) && controllers[module].hasOwnProperty(controllerFuncName)) {
                // function exists within module within controller,
                // so add this route to express app routes.
                app[method](path, controllers[module][controllerFuncName]);
            }

            // Document the route!
            document(doc, method, path, controllerFuncName, comment);
        }
    };
};