var emitter = require('./event-emitter')();
var reporter = require('nodeunit').reporters.default;
var formatting = require('nodeunit/bin/nodeunit.json');

//
// Using nodeunit/bin/nodeunit.json formatting
// Bold
function b(s) {
    return formatting.bold_prefix + s + formatting.bold_suffix;
}

// Green
function g(s) {
    return formatting.ok_prefix + s + formatting.ok_suffix;
}

// Red
function r(s) {
    return formatting.error_prefix + s + formatting.error_suffix;
}

reporter.run(['/test/autotests/questions.js'], null, function (failures1) {
    reporter.run(['/test/autotests/question_comments.js'], null, function (failures2) {
        reporter.run(['/test/autotests/answers.js'], null, function (failures3) {
            reporter.run(['/test/autotests/answer_comments.js'], null, function (failures4) {

                var failures = [failures1, failures2, failures3, failures4],
                    failureCount = 0,
                    i;

                for (i = 0; i < failures.length; i = i + 1) {
                    if (failures[i]) {
                        failureCount = failureCount + 1;
                    }
                }

                if (failureCount === 0) {
                    console.log('\n' + b(g('✔ ALL TESTS PASSED')));
                } else {
                    console.log('\n' + b(r('✖ ' + failureCount + ' TEST SCRIPTS FAILED')));

                }
                emitter.emit('tests-done');
                //}); 
            });
        });
    });
});
