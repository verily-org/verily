
exports.route = function (app, controllers, doc) {
    var route = require('../route')(app, controllers, doc, __filename);

    route('post', '/subscriber', 'new', 'Add subscriber');

};