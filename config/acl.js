'use strict';

// Access Control Lists

var debug = require('debug')('acl'),
	acl = require('acl'),
	db = require('./db'),
	express = require('express'),
	pathToRegexp = require('path-to-regexp');

/**
 * Create an ACL instance.
 * Roles are saved into MongoDB, documents have `acl-` as prefix.
 */
module.exports.instance = acl = new acl(new acl.mongodbBackend(db.connection.db, 'acl-'));

/**
 * Helper fuction to check if a key and value exists.
 *
 * @param  {[type]}  obj   [description]
 * @param  {[type]}  key   [description]
 * @param  {[type]}  value [description]
 * @return {Boolean}       [description]
 */
function hasValue(obj, key, value) {
	return obj.hasOwnProperty(key) && obj[key] === value;
}

/**
 * Check if an object has a name=currentUser pair.
 *
 * @param  {[type]}  keys [description]
 * @return {Boolean}      [description]
 */
function hasCurrentUserKey(keys) {
	return keys.some(function(key) {
		return hasValue(key, 'name', 'currentUser');
	});
}

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
		debug('Not authenticated');
		res.status(401).json({error: 'Not authenticated'});
		return;
	}

	// Get all roles of current user role.
	acl.userRoles(req.user.username, function(err, roles) {
		if (err) {
			res.status(500).json({error: 'Unexpected authorization error'});
			return;
		}

		// Get all resources by roles and compare to current path
		acl.whatResources(roles, function(err, resources) {
			if (err) {
				res.status(500).json({error: 'Unexpected authorization error'});
				return;
			}

			var keys, regexp, isMatch, result, username, resource, reqResource = '',
				originalUrl = req.originalUrl,
				apiPath = originalUrl.replace(/\/?api\/?/, '').split('?')[0];

			for (resource in resources) {
				keys = [];
				regexp = pathToRegexp(resource, keys);
				isMatch = regexp.test(apiPath);

				if (isMatch) {
					if (hasCurrentUserKey(keys)) {
						// Get the requested user
						result = regexp.exec(apiPath);
						keys.map(function(key, i) {
							if (key.name === 'currentUser') {
								username = result[i + 1];
							}
						});

						if (username !== req.user.username ) {
							continue;
						}
					}

					reqResource = resource;
					break;
				}
			}

			if (!reqResource) {
				debug(req.user.username + ' with role ' + req.user.role + ' has no permissions for ' + apiPath);
				res.status(403).json({error: 'Forbidden'});
				return;
			}

			acl.isAllowed(req.user.username, reqResource, req.method, function(err, result) {
				if (err) {
					res.status(500).json({error: 'Unexpected authorization error'});
					return;
				}
				if (result) {
					next();
				} else {
					debug(req.user.username + ' with role ' + req.user.role + ' is not allowed to access resource ' + reqResource + ' via ' + req.method );
					res.status(403).json({error: 'Forbidden'});
					return;
				}
			});
		});
	});
};

module.exports.debugRoute = express.Router();
module.exports.debugRoute.get('/me', function(req, res) {
	res.status(200).json(req.user);
});
module.exports.debugRoute.get('/me/roles', function(req, res) {
	acl.userRoles(req.user.username, function(err, roles) {
		if (err) {
			res.status(500).json(err);
		} else {
			res.status(200).json(roles);
		}
	});
});
module.exports.debugRoute.get('/me/resources', function(req, res) {
	acl.whatResources(req.user.role, function(err, resources) {
		if (err) {
			res.status(500).json(err);
		} else {
			res.status(200).json(resources);
		}
	});
});

/**
 * Set role to a user.
 *
 * Existing roles are replaced by the new one.
 */
module.exports.setRole = function(user, role, callback) {
	var newRoles = [ role, user ]; // New role plus username as role
	acl.userRoles(user, function(err, roles) {
		if (err) {
			callback(err);
		} else if (roles && roles.length > 0) {
			acl.removeUserRoles(user, roles, function(err) {
				if (err) {
					callback(err);
				} else {
					acl.addUserRoles(user, newRoles , function(err) {
						callback(err);
					});
				}
			});
		} else {
			acl.addUserRoles(user, newRoles, function(err) {
				callback(err);
			});
		}
	});
};

module.exports.removeRole = function(user, role, callback) {
	acl.userRoles(user, function(err, roles) {
		if (err) {
			callback(err);
		} else if (roles && roles.length > 0) {
			acl.removeUserRoles(user, role, function(err) {
				if (err) {
					callback(err);
				} else {
					callback(null);
				}
			});
		} else {
			callback(err);
		}
	});
};

module.exports.removeRoles = function(user, callback) {
	acl.userRoles(user, function(err, roles) {
		if (err) {
			callback(err);
		} else if (roles && roles.length > 0) {
			acl.removeUserRoles(user, roles, function(err) {
				if (err) {
					callback(err);
				} else {
					callback(null);
				}
			});
		} else {
			callback(err);
		}
	});
};


/**
 * Default permissions and resources
 *
	{resources: 'login', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'logout', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'users', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'users/me', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'users/:user', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'users/:user/subjects', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'users/:currentUser/subjects', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'subjects', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/tasks', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/tasks/:task', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/tasks/:task/levels', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/tasks/:task/levels/:level', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/member', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/member/:member', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/member/:member/evaluations', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/member/:member/evaluations/:evaluation', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/member/:member/comments', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
	{resources: 'modules/:module/subjects/:subject/member/:member/comments/:comment', permissions: ['GET', 'PUT', 'POST', 'DELETE']},
 */
module.exports.rules = [
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
			{resources: 'users', permissions: ['POST']},
		]
	},
	{
		roles: ['student'],
		allows: [
			{resources: 'login', permissions: ['POST']},
			{resources: 'logout', permissions: ['POST']},
			{resources: 'users/me', permissions: ['GET']},
			{resources: 'users/:currentUser', permissions: ['GET', 'PUT']},
			{resources: 'users/:currentUser/subjects', permissions: ['GET']},
			{resources: 'subjects', permissions: ['GET']},
			{resources: 'modules/:module/subjects/:subject/members', permissions: ['POST']},
		]
	},
	{
		roles: ['assistant'],
		allows: [
			{resources: 'login', permissions: ['POST']},
			{resources: 'logout', permissions: ['POST']},
			{resources: 'users/me', permissions: ['GET']},
			{resources: 'users/:currentUser', permissions: ['GET', 'PUT']},
			{resources: 'users/:currentUser/subjects', permissions: ['GET']},
			{resources: 'subjects', permissions: ['GET']},
		]
	},
	{
		roles: ['lecturer'],
		allows: [
			{resources: 'login', permissions: ['POST']},
			{resources: 'logout', permissions: ['POST']},
			{resources: 'users/me', permissions: ['GET']},
			{resources: 'users/:currentUser', permissions: ['GET', 'PUT']},
			{resources: 'users/:currentUser/subjects', permissions: ['GET']},
			{resources: 'years', permissions: ['GET']},
			{resources: 'semesters', permissions: ['GET']},
			{resources: 'subjects', permissions: ['GET']},
			{resources: 'modules', permissions: ['GET']},
			{resources: 'modules/:module', permissions: ['GET']},
			{resources: 'modules/:module/subjects', permissions: ['POST']},
		]
	},
	{
		roles: ['administrator'],
		allows: [
			{resources: 'login', permissions: ['POST']},
			{resources: 'logout', permissions: ['POST']},
			{resources: 'users', permissions: ['GET', 'POST']},
			{resources: 'users/me', permissions: ['GET']},
			{resources: 'users/:user', permissions: ['GET', 'PUT', 'DELETE']},
			{resources: 'users/:user/subjects', permissions: ['GET']},
			{resources: 'users/:currentUser/subjects', permissions: ['GET']},
			{resources: 'years', permissions: ['GET']},
			{resources: 'semesters', permissions: ['GET']},
			{resources: 'subjects', permissions: ['GET']},
			{resources: 'modules', permissions: ['GET', 'POST']},
			{resources: 'modules/:module', permissions: ['GET', 'PUT', 'DELETE']},
			{resources: 'modules/:module/subjects', permissions: ['GET', 'POST']},
			{resources: 'modules/:module/subjects/:subject', permissions: ['GET', 'PUT', 'DELETE']},
			{resources: 'modules/:module/subjects/:subject/members', permissions: ['GET', 'POST']},
			{resources: 'modules/:module/subjects/:subject/members/:member', permissions: ['GET', 'PUT', 'DELETE']},
			{resources: 'modules/:module/subjects/:subject/members/:member/evaluations', permissions: ['GET', 'POST']},
			{resources: 'modules/:module/subjects/:subject/members/:member/evaluations/:evaluation', permissions: ['GET', 'PUT', 'DELETE']},
			{resources: 'modules/:module/subjects/:subject/members/:member/comments', permissions: ['GET', 'POST']},
			{resources: 'modules/:module/subjects/:subject/members/:member/comments/:comment', permissions: ['GET', 'PUT', 'DELETE']},
			{resources: 'modules/:module/subjects/:subject/tasks', permissions: ['GET', 'POST']},
			{resources: 'modules/:module/subjects/:subject/tasks/:task', permissions: ['GET', 'PUT', 'DELETE']},
			{resources: 'modules/:module/subjects/:subject/tasks/:task/levels', permissions: ['GET', 'POST']},
			{resources: 'modules/:module/subjects/:subject/tasks/:task/levels/:level', permissions: ['GET', 'PUT', 'DELETE']},
		]
	}
];

module.exports.addAllowRules = function(callback) {
	acl.allow(module.exports.rules, callback);
};

module.exports.removeAllowRules = function(callback) {
	//acl.removeAllow(module.exports.rules, callback); // removeAllow( role, resources, permissions, function(err) )
};

db.connection.on('connected', function() {
	acl.allow(module.exports.rules);
});
