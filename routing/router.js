// A generic router: instantiates all found routes.
// Routes are defined in modules inside the 'routes' directory.
var fs = require('fs');
var paths = require('path');

var enums = require('../enums');

// underscored strings converted to space-separated sentence-cased strings.
// ex. questions => Questions
// ex. question_comments => Question Comments
function humanise(str) {
    var underscore = str.indexOf('_'),
        returner = str.charAt(0).toUpperCase();
    if (underscore > 0) {
        returner += str.substring(1, underscore);
        // remove the underscore, and make the following character uppercase
        returner += ' ' + str.charAt(underscore + 1).toUpperCase();
        if (underscore + 2 < str.length) {
            returner += str.substring(underscore + 2);
        }
    } else {
        returner += str.substring(1);
    }
    return returner;
}

module.exports = function (app, controllers) {

    // Read in all route modules.

    var doc = {},
        title = '# API Documentation',
        p = 'routes',
        path = paths.resolve(__dirname, p);

    // Generation of API documentation and demo of shell script.
    function document() {
        var mdDoc = [],

            order = require('./order').order,
            completeCurlCommands = [],
            i,
            model,
            moduleHeading,
            j;
        // All cURL commands.

        // Traverse doc in modelling order.
        for (i in order) {
            if (order.hasOwnProperty(i)) {
                model = order[i];
                if (doc.hasOwnProperty(model)) {
                    moduleHeading = '## ' + humanise(model);
                    mdDoc.push(moduleHeading + '\n\n' + doc[model].doc.join('\n\n'));

                    // Add to all cURL commands.
                    for (j = 0; j < doc[model].demo.length; j = j + 1) {
                        completeCurlCommands.push(doc[model].demo[j]);
                    }
                }
            }
        }

        // Append the cURL commands to the .sh bash script file.
        fs.appendFile(enums.demo, completeCurlCommands.join('\n\n'), function (err) {
            if (err) {
                throw err;
            }
        });

        fs.writeFile(enums.apiDoc, title + '\n\n' + mdDoc.join('\n\n\n'), function (err) {
            if (err) {
                throw err;
            }
        });
    }

    // Get all route modules.
    fs.readdir(path, function (err, filenames) {
        if (err) {
            throw err;
        }
        if (filenames) {
            // Iterate over each route module.
            var i, moduleName;
            for (i = 0; i < filenames.length; i = i + 1) {
                // Just get the *name* of the file, so exclude .js extension.
                moduleName = paths.basename(filenames[i], '.js');

                doc[moduleName] = {
                    doc: [],
                    demo: []
                };

                // Run the routes and add to the documentation.
                require('./' + p + '/' + filenames[i]).route(app, controllers, doc[moduleName]);
            }
            // Generate API docs and the demonstration shell script!
            if (enums.document) {
                document();
            }
        }
    });
};