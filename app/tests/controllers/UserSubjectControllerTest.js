'use strict';

var UserSubjectController = require('../../controllers/UserSubjectController'),
	should = require('should'),
	db = require('../db'),
	users = require('../users'),
	subjects = require('../subjects'),
	async = require('async');

describe('UserSubjectController', function() {

	beforeEach(function(done) {
		async.series([
			db.clear,
			db.initializeTestData
		], done);
	});

	describe('list', function() {
		it('should find all subjects for students', function(done) {
			UserSubjectController.list(function(err, apiSubjects) {
				should.not.exist(err);
				should.exist(apiSubjects);

				apiSubjects.should.have.a.lengthOf(1);

				apiSubjects[0].should.have.property( 'subject' )
					.and.have.property('semester')
					.and.be.equal(subjects.wba1Wise1415.semester);

				apiSubjects[0].should.have.property( 'subject' )
					.and.have.property('module')
					.and.have.property('name')
					.and.be.equal(subjects.wba1Wise1415.module.name);

				done();
			}, users.admin1, users.student1.username);
		});

		it('should find all subjects for an subject creator', function(done) {
			UserSubjectController.list(function(err, apiSubjects) {
				should.not.exist(err);
				should.exist(apiSubjects);

				apiSubjects.should.have.a.lengthOf(1);

				apiSubjects[0].should.have.property( 'subject' )
					.and.have.property('semester')
					.and.be.equal(subjects.wba1Wise1415.semester);

				apiSubjects[0].should.have.property( 'subject' )
					.and.have.property('module')
					.and.have.property('name')
					.and.be.equal(subjects.wba1Wise1415.module.name);

				done();
			}, users.admin1, users.lecturer1.username);
		});

		it('should return an error for an invalid user object', function(done) {
			UserSubjectController.list(function(err, apiSubjects) {
				should.exist(err);
				should.not.exist(apiSubjects);

				done();
			}, users.admin1, {});
		});
	});

});
