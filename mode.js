var enums = require('./enums.json');

exports.DEV_MODE = 'DEVELOPMENT_MODE';
exports.PROD_MODE = 'PRODUCTION_MODE';

exports.isProduction = exports.isHeroku = function() {
    return (process.env.HEROKU_POSTGRESQL_ONYX_URL !== undefined);
}
exports.isPgSQL = function() {
    return true;
    //return exports.isHeroku();
}

exports.getRunningMode = function() {
    var mode;
    if (exports.isHeroku() || enums.productionMode === true) {
        return exports.PROD_MODE;
    } else {
        return exports.DEV_MODE;
    }
}