'use strict';

var supertest = require('supertest'),
	server = require('../../../server'),
	db = require('../db'),
	agentsAPI = require('../agents'),
	async = require('async'),
	users = require('../users');

describe('Subjects API', function() {
	var agents;

	function setUpAgents(done) {
		agentsAPI.setUp( function() {
			agents = agentsAPI.getAll();
			done();
		});
	}

	beforeEach(function(done) {
		async.series([
			db.clear,
			db.initializeTestData,
			setUpAgents
		], done);
	});

	it('should return no subjects at beginning for guests', function(done) {
		agents.student3
			.get('/api/users/' + users.student3.username + '/subjects')
			.expect(403)
			.end(done);
	});

	it('should return no subjects of other users for guests', function(done) {
		agents.student3
			.get('/api/users/' + users.student1.username + '/subjects')
			.expect(403)
			.end(done);
	});

	it('should return subjects at beginning for students', function(done) {
		agents.student1
			.get('/api/users/' + users.student1.username + '/subjects')
			.expect(200)
			.end(done);
	});

	it('should return no subjects of other users for students', function(done) {
		agents.student1
			.get('/api/users/' + users.student2.username + '/subjects')
			.expect(403)
			.end(done);
	});

	it('should return subjects at beginning for assistant', function(done) {
		agents.assistant1
			.get('/api/users/' + users.assistant1.username + '/subjects')
			.expect(200)
			.end(done);
	});

	it('should return no subjects of other users for assistant', function(done) {
		agents.assistant1
			.get('/api/users/' + users.student1.username + '/subjects')
			.expect(403)
			.end(done);
	});

	it('should return subjects at beginning for lecturer', function(done) {
		agents.lecturer1
			.get('/api/users/' + users.lecturer1.username + '/subjects')
			.expect(200)
			.end(done);
	});

	it('should return no subjects of other users for lecturer', function(done) {
		agents.lecturer1
			.get('/api/users/' + users.student2.username + '/subjects')
			.expect(403)
			.end(done);
	});

	it('should return subjects at beginning for admin', function(done) {
		agents.admin1
			.get('/api/users/' + users.admin1.username + '/subjects')
			.expect(200)
			.end(done);
	});

	it('should return subjects of other users for admin', function(done) {
		agents.admin1
			.get('/api/users/' + users.student1.username + '/subjects')
			.expect(200)
			.end(done);
	});

});
