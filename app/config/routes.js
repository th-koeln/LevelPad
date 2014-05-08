'use strict';

var express = require('express'),
	ExampleController = require('../api/ExampleController'),
	ChatController = require('../api/ChatController');

//
// For Angular JS we show always the index.html WHEN
//
// * The URL path does NOT end with ".json".
// * The accept header does NOT contain a JSON accept header.
//
var redirectBrowsersToIndex = function(req, res, next) {
	if (req.accepts('json', 'html') == 'html' && !req.path.match('.json$')) {
		res.sendfile('index.html', { root: __dirname + '/../public' });
	} else {
		next();
	}
};


var auth = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect('/login');
	}
};

/**
 * Application routes
 */
module.exports = function(app, io) {

	// We could extend this routes later here..
	app.route('/login').all(redirectBrowsersToIndex);
	app.route('/logout').all(redirectBrowsersToIndex);

	app.route('/chat').all(redirectBrowsersToIndex);

	app.get('/api/example/awesomeThings', ExampleController.awesomeThings);
	app.get('/chat', ChatController.index);

	app.route('/account/*')
		.all(auth)
		.get(redirectBrowsersToIndex)
		.all(require('../resources/Account').account);

	app.route('/users/*')
		.all(auth)
		.get(redirectBrowsersToIndex)
		.all(require('../resources/Users').users);

	app.route('/subjects/*')
		.all(auth)
		.get(redirectBrowsersToIndex)
		.all(require('../resources/Subjects').subjects);

	app.route('/subjects/:subject/artifacts/*')
		.all(auth)
		.get(redirectBrowsersToIndex)
		.all(require('../resources/Artifacts').artifacts);


	io.sockets.on('connection', function (socket) {
		console.log('new connection...');

		socket.broadcast.emit('chat_message', {
			type: 'message',
			text: 'hallo!'
		});

		socket.on('chat_message', function (data) {
			ChatController.receiveMessageIO(io, socket, data);
		});
	});
};
