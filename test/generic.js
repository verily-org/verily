exports.valid = function (err, sent, recv) {
    // All properties of data sent should be same
    // as properties received.
    var valid = true,
        i;
    if (err || !recv) {
        valid = false;
    } else {
        for (i in sent) {
            if (sent.hasOwnProperty(i)) {
                if (!recv.hasOwnProperty(i) || sent[i] !== recv[i]) {
                    valid = false;
                    break;
                }
            }
        }
    }
    return valid;
};
var valid = exports.valid;


exports.validArray = function (err, sent, recv) {
    // All array elements from sent and received should be the same.
    var isValid = true,
        i,
        isArrayElemValid;
    if (err || !recv || sent.length !== recv.length) {
        isValid = false;
    } else {
        for (i = 0; i < sent.length; i = i + 1) {
            isArrayElemValid = valid(undefined, sent[i], recv[i]);
            if (!isArrayElemValid) {
                isValid = false;
                break;
            }
        }
    }
    return isValid;
};