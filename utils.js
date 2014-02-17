// Expects an object (key-value pairs).
// ex. {hello: world, foo: bar} => "hello=world&foo=bar"
exports.bodyEncode = function (data) {
    var items = [],
        i;

    for (i in data) {
        if (data.hasOwnProperty(i)) {
            items.push(i + '=' + data[i]);
        }
    }
    return items.join('&');
};