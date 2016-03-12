var fs = require('fs');
var async = require('async');
var language = "en";
var dictionary = {};

console.log("init localisation");
var files = fs.readdirSync('./localize/dictionary');
async.eachSeries(files, function(v, cb) {
    try {
    console.log('localisation parsing '+v);
    var dict = JSON.parse(fs.readFileSync('./localize/dictionary/'+v));
    dictionary[dict.id] = dict;
    console.log('parsing ok');
    } catch (e)
    { console.log("!!! ERROR WHILE PARSING "+v+" !!!"); console.log(e); }
    cb();
});

module.exports.setLang = function (lang) {
    language = lang;
}

module.exports.getLang = function() {
    return language;
}

module.exports.translate = function(phrase) {
    if(!dictionary[language] || !dictionary[language][phrase])
    {
        return dictionary["en"][phrase] || "";
    }
    return dictionary[language][phrase];
}