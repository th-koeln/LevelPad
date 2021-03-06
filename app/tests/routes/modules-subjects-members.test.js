'use strict';

require('should-http');

var	should = require('should'),
	db = require('../db'),
	async = require('async'),
	agentsAPI = require('../agents'),
	subjects = require('../subjects'),
	users = require('../users'),
	User = require('../../models/User');

describe('Modules Subjects Members API', function() {
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

	it('should return 403 when a guest wants to access module subject members', function(done) {
		agents.student3
			.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(403);
				res.should.be.json;

				should.exist(res.body); // @todo Check error response

				done(err);
			});
	});

	it('should return 200 when a student tries to read a subject with correct password', function(done) {
		async.waterfall([
			function(next){
				agents.admin1
					.get('/api/modules/' + subjects.wba2Sose15.module.slug + '/subjects/' + subjects.wba2Sose15.slug + '/members')
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						next(err);
					});
			},
			function(next) {
				User.findOne({ username: users.student2.username }, next);
			},
			function(user, next){
				agents.student2
					.post('/api/modules/' + subjects.wba2Sose15.module.slug + '/subjects/' + subjects.wba2Sose15.slug + '/members')
					.send({
						id: user._id,
						role: 'member',
						registrationPassword: 'testpassword'
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						res.body.should.have.property('subject');
						res.body.should.have.property('user');
						res.body.should.have.property('role');

						next(err);
					});
			}
		], done);
	});

	it('should return 403 when a student tries to read a subject with wrong password', function(done) {
		async.waterfall([
			function(next){
				agents.admin1
					.get('/api/modules/' + subjects.wba2Sose15.module.slug + '/subjects/' + subjects.wba2Sose15.slug + '/members')
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						next(err);
					});
			},
			function(next) {
				User.findOne({ username: users.student2.username }, next);
			},
			function(user, next){
				agents.student2
					.post('/api/modules/' + subjects.wba2Sose15.module.slug + '/subjects/' + subjects.wba2Sose15.slug + '/members')
					.send({
						id: user._id,
						role: 'member',
						registrationPassword: 'wrongpassword'
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(403);
						res.should.be.json;

						should.exist(res.body);

						res.body.should.have.property('name')
							.and.be.equal('AuthenticationRequiredError');

						next(err);
					});
			}
		], done);
	});

	it('should return 400 when a student tries to read a password protected subject without password', function(done) {
		async.waterfall([
			function(next){
				agents.admin1
					.get('/api/modules/' + subjects.wba2Sose15.module.slug + '/subjects/' + subjects.wba2Sose15.slug + '/members')
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						next(err);
					});
			},
			function(next) {
				User.findOne({ username: users.student2.username }, next);
			},
			function(user, next){
				agents.student2
					.post('/api/modules/' + subjects.wba2Sose15.module.slug + '/subjects/' + subjects.wba2Sose15.slug + '/members')
					.send({
						id: user._id,
						role: 'member'
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(400);
						res.should.be.json;

						should.exist(res.body);

						res.body.should.have.property('name')
							.and.be.equal('ArgumentNullError');

						next(err);
					});
			}
		], done);
	});

	it('should return 200 when an admin reads members of a module subject', function(done) {
		agents.admin1
			.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(200);
				res.should.be.json;

				should.exist(res.body);

				var apiMembers = res.body;
				apiMembers.should.have.a.lengthOf(4);

				done(err);
			});
	});

	it('should return 200 when an admin reads the creator of a module subject', function(done) {
		agents.admin1
			.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/?role=creator')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(200);
				res.should.be.json;

				should.exist(res.body);

				var apiMembers = res.body;
				apiMembers.should.have.a.lengthOf(1);

				done(err);
			});
	});

	it('should return 400 when an admin creates a new member with missing id', function(done) {
		async.waterfall([
			function(next) {
				agents.admin1
					.post('/api/modules/' + subjects.wba2Sose14.module.slug + '/subjects/' + subjects.wba2Sose14.slug + '/members/')
					.send({
						role: 'member',
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(400);
						res.should.be.json;

						should.exist(res.body);

						res.body.should.have.property('name')
							.and.be.equal('ArgumentNullError');

						res.body.should.have.property('argumentName')
							.and.be.equal('id');

						next(err);
					});
			}
		], done);
	});

	it('should return 400 when an admin creates a new member with missing role', function(done) {
		async.waterfall([
			function(next) {
				agents.admin1
					.post('/api/modules/' + subjects.wba2Sose14.module.slug + '/subjects/' + subjects.wba2Sose14.slug + '/members/')
					.send({
						id: '546a1b22c6da9447692f6df9',
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(400);
						res.should.be.json;

						should.exist(res.body);

						res.body.should.have.property('name')
							.and.be.equal('ArgumentNullError');

						res.body.should.have.property('argumentName')
							.and.be.equal('role');

						next(err);
					});
			}
		], done);
	});

	it('should return 200 (change to 201!) when an admin creates a new member', function(done) {
		async.waterfall([
			function(next) {
				User.findOne({ username: users.student2.username }, next);
			},
			function(user, next) {
				agents.admin1
					.post('/api/modules/' + subjects.wba2Sose14.module.slug + '/subjects/' + subjects.wba2Sose14.slug + '/members/')
					.send({
						id: user._id,
						role: 'member',
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						next(err);
					});
			}
		], done);
	});

	it('should return 400 when an admin reads an invalid member id', function(done) {
		async.waterfall([
			function(next) {
				agents.admin1
					.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/doesnotexit')
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(400);
						res.should.be.json;

						should.exist(res.body);

						res.body.should.have.property('name')
							.and.be.equal('TypeError');

						next(err);
					});
			}
		], done);
	});

	it('should return 404 when an admin reads an not existing member', function(done) {
		async.waterfall([
			function(next) {
				agents.admin1
					.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/546a1b22c6da9447692f6df9')
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(404);
						res.should.be.json;

						should.exist(res.body);

						next(err);
					});
			}
		], done);
	});

	it('should return 200 when an admin updates a member', function(done) {
		async.waterfall([
			function(next) {
				agents.admin1
					.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/')
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						var memberId = res.body[0]._id;

						next(err, memberId);
					});
			},
			function(memberId, next){
				agents.admin1
					.put('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/' + memberId)
					.send({
						role: 'assistant',
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						next(err);
					});
			}
		], done);
	});

	it('should return 200 when an admin deletes a member', function(done) {
		async.waterfall([
			function(next) {
				agents.admin1
					.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/')
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;

						should.exist(res.body);

						var memberId = res.body[0]._id;

						next(err, memberId);
					});
			},
			function(memberId, next){
				agents.admin1
					.delete('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/' + subjects.wba1Wise1415.slug + '/members/' + memberId)
					.set('Accept', 'application/json')
					.end(function(err, res) {
						should.not.exist(err);
						res.should.have.status(200);
						res.should.be.json;
						should.exist(res.body);

						next(err);
					});
			}
		], done);
	});

	it('should return 404 for unknown module', function(done) {
		agents.admin1
			.get('/api/modules/unknown/subjects/' + subjects.wba1Wise1415.slug + '/members/')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(404);
				res.should.be.json;
				should.exist(res.body);

				done(err);
			});
	});

	it('should return 404 for unknown subject', function(done) {
		agents.admin1
			.get('/api/modules/' + subjects.wba1Wise1415.module.slug + '/subjects/sose18/members/')
			.set('Accept', 'application/json')
			.end(function(err, res) {
				should.not.exist(err);
				res.should.have.status(404);
				res.should.be.json;
				should.exist(res.body);

				done(err);
			});
	});
});

