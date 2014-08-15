var enums = require('./enums.json');

exports.DEV_MODE = 'DEVELOPMENT_MODE';
exports.PROD_MODE = 'PRODUCTION_MODE';

exports.isProduction = exports.isHeroku = function() {
    return (process.env.DATABASE_URL !== undefined);
}

exports.getRunningMode = function() {
    var mode;
    if (exports.isHeroku() || enums.productionMode === true) {
        return exports.PROD_MODE;
    } else {
        return exports.DEV_MODE;
    }
}