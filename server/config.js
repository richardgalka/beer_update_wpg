var path = require('path');

module.exports = {
	mongo: {
		dbURl: 'localhost:3000'
	},
	security: {
		dbName: 'beer'
	},
	server: {
		listenPort: 3000,
		securePort: false,
		staticUrl: '/static'
	},
	app: {
		name: 'Beer View'
	}
}