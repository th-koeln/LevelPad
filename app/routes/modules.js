'use strict';

/**
 * RESTful API for modules.
 */

var express = require('express'),
	swag = require('bo-swag'),
	modules = swag.router(express.Router()),
	ModuleController = require('../controllers/ModuleController'),
	_helpers = require('./_helpers');

modules.param('moduleSlug', function (req, res, next, moduleSlug) {
	ModuleController.read(function(err, module) {
		if (err) {
			return _helpers.sendResult(res)(err);
		}

		req.module = module;
		next(err);
	}, req.user, moduleSlug);
});

/**
 * Get all modules.
 */
modules.get('/', {
	summary: 'Get all modules',
	description: 'List all tasks and apply optional filter.',
	tags: [ 'Module' ],
}, function (req, res) {
	ModuleController.list(_helpers.sendResult(res), req.user);
});

/**
 * Create a module.
 */
modules.post('/', {
	summary: 'Create a module',
	description: 'Create a new module.',
	tags: [ 'Module' ],
}, function (req, res) {
	ModuleController.create(_helpers.sendResult(res), req.user, req.body);
});

/**
 * Read a module.
 */
modules.get('/:moduleSlug', {
	summary: 'Get a module',
	description: 'Get an existing module.',
	tags: [ 'Module' ],
}, function (req, res) {
	ModuleController.read(_helpers.sendResult(res), req.user, req.params.moduleSlug);
});

/**
 * Update a module.
 */
modules.put('/:moduleSlug', {
	summary: 'Update a module',
	description: 'Update an existing module.',
	tags: [ 'Module' ],
}, function (req, res) {
	ModuleController.update(_helpers.sendResult(res), req.user, req.params.moduleSlug, req.body);
});

/**
 * Delete a module.
 */
modules.delete('/:moduleSlug', {
	summary: 'Delete a module',
	description: 'Delete an existing module.',
	tags: [ 'Module' ],
}, function (req, res) {
	ModuleController.delete(_helpers.sendResult(res), req.user, req.params.moduleSlug);
});

/**
 * Register subresources for modules.
 */
modules.use('/:moduleSlug/subjects', require('./subjects'));

module.exports = modules;
