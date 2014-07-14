'use strict';

// Access Control Lists

var acl = require('acl'),
	db = require('./db'),
	pathToRegexp = require('path-to-regexp');

/**
 * Create an ACL instance.
 * Roles are saved into MongoDB, documents have `acl-` as prefix.
 */
module.exports.acl = acl = new acl(new acl.mongodbBackend(db.connection.db, 'acl-'));

/**
 * ACL Middleware
 *
 * Middleware for API routes:
 *  - Returns 401 response when user is not authenticated
 *  - Returns 403 response when user is not allowed to perform an action
 *  - Returns 500 response on error
 */
module.exports.middleware = function middleware(req, res, next) {
	if (!req.isAuthenticated()) {
		console.log('Not authenticated');
		res.json(401, {error: 'Not authenticated'});
		return;
	}

	// Get all resources by current user role and compare to current path
	acl.whatResources(req.user.role, function(err, resources) {
		if (err) {
			res.json(500, {error: 'Unexpected authorization error'});
			return;
		}

		var keys, regexp, isMatch, resource, reqResource = '',
			originalUrl = req.originalUrl,
			apiPath = originalUrl.replace(/\/?api\/?/, '').split('?')[0];

		for (resource in resources) {
			keys = [];
			regexp = pathToRegexp(resource, keys);
			isMatch = regexp.test(apiPath);

			if (isMatch) {
				reqResource = resource;
				break;
			}
		}

		if (!reqResource) {
			console.log(req.user.username + ' with role ' + req.user.role + ' has no permissions for ' + apiPath);
			res.json(403, {error: 'Forbidden'});
			return;
		}

		acl.isAllowed(req.user.username, reqResource, req.method, function(err, result) {
			if (err) {
				res.json(500, {error: 'Unexpected authorization error'});
				return;
			}

			if (result) {
				next();
			} else {
				console.log(req.user.username + ' with role ' + req.user.role + ' is not allowed to access resource ' + reqResource + ' via ' + req.method );
				res.json(403, {error: 'Forbidden'});
				return;
			}
		});
	});
};

/**
 * Set role to a user.
 *
 * Existing roles are replaced by the new one.
 */
module.exports.setRole = function setRole(user, role, callback) {
	acl.userRoles(user, function(err, roles) {
		if (err) {
			callback(err);
		} else {
			acl.removeUserRoles(user, roles, function(err) {
				if (err) {
					callback(err);
				} else {
					acl.addUserRoles(user, role, function(err) {
						callback(err);
					});
				}
			});
		}
	});
};

db.connection.on('connected', function() {
	/**
	 * Define default permissions for resources
	 *
		{resources: 'login', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'logout', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'users', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'users/me', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'users/:user', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'subjects', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects/:subject', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects/:subject/tasks', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects/:subject/tasks/:task', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects/:subject/tasks/:task/teams', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects/:subject/tasks/:task/teams/:team', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects/:subject/tasks/:task/teams/:team/feedbacks', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
		{resources: 'modules/:module/subjects/:subject/tasks/:task/teams/:team/feedbacks/:feedback', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	 */

	acl.allow([
		{
			roles: ['public'],
			allows: [
				{resources: 'login', permissions: ['POST']},
				{resources: 'logout', permissions: ['POST']},
			]
		},
		{
			roles: ['guest'],
			allows: [
				{resources: 'login', permissions: ['POST']},
				{resources: 'logout', permissions: ['POST']},
				{resources: 'users', permissions: ['POST', 'GET']},
			]
		},
		{
			roles: ['student'],
			allows: [
				{resources: 'login', permissions: ['POST']},
				{resources: 'logout', permissions: ['POST']},
				{resources: 'users/me', permissions: ['GET', 'PUT']},
			]
		},
		{
			roles: ['assistant'],
			allows: [
				{resources: 'login', permissions: ['POST']},
				{resources: 'logout', permissions: ['POST']},
				{resources: 'users/me', permissions: ['GET', 'PUT']},
			]
		},
		{
			roles: ['lecturer'],
			allows: [
				{resources: 'login', permissions: ['POST']},
				{resources: 'logout', permissions: ['POST']},
				{resources: 'users/me', permissions: ['GET', 'PUT']},
			]
		},
		{
			roles: ['administrator'],
			allows: [
				{resources: 'login', permissions: ['POST']},
				{resources: 'logout', permissions: ['POST']},
				{resources: 'users', permissions: ['GET', 'POST']},
				{resources: 'users/me', permissions: ['GET', 'PUT']},
				{resources: 'users/:user', permissions: ['GET', 'PUT', 'DELETE']},
				{resources: 'subjects', permissions: ['GET']},
				{resources: 'modules', permissions: ['GET', 'POST']},
				{resources: 'modules/:module', permissions: ['GET', 'PUT', 'DELETE']},
				{resources: 'modules/:module/subjects', permissions: ['GET', 'POST']},
				{resources: 'modules/:module/subjects/:subject', permissions: ['GET', 'PUT', 'DELETE']},
				{resources: 'modules/:module/subjects/:subject/tasks', permissions: ['GET', 'POST']},
				{resources: 'modules/:module/subjects/:subject/tasks/:task', permissions: ['GET', 'PUT', 'DELETE']},
				{resources: 'modules/:module/subjects/:subject/tasks/:task/teams', permissions: ['GET', 'POST', 'DELETE']},
				{resources: 'modules/:module/subjects/:subject/tasks/:task/teams/:team', permissions: ['GET', 'POST', 'DELETE']},
				{resources: 'modules/:module/subjects/:subject/tasks/:task/teams/:team/feedbacks', permissions: ['GET', 'POST', 'DELETE']},
				{resources: 'modules/:module/subjects/:subject/tasks/:task/teams/:team/feedbacks/:feedback', permissions: ['GET', 'PUT', 'DELETE']},
			]
		}
	]);

});