var orm = require("orm");

orm.connect("sqlite://app.db", function (err, db) {
	//

            // Instance.cache is an important setting.
            // By default the cache is enabled but this means
            // that fields set not in the create() function will not be
            // picked up by the model (all fields successfully save into DB).
            db.settings.set('instance.cache', false);

            db.load("./models", function (err) {
		var User;
                if (err === null || err === undefined) {
                    console.log('Model loaded');
                } else {
                    console.log('Model loading failed:');
                    console.log(err);
                }

                db.sync(function () {
                    console.log('model-synced');
			User = db.models.user;
			User.create(
				[{'name': 'test',
				'role':'editor'},],
				function (err, items) {
					console.log('err:', err);
					console.log('items:', items);
					User.find({}, function (err, items) {
						console.log(items);
					});
			});
                });

            });
});
