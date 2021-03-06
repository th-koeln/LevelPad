'use strict';

/**
 * RESTful API for years.
 */

var express = require('express'),
	swag = require('bo-swag'),
	years = swag.router(express.Router()),
	YearController = require('../controllers/YearController'),
	_helpers = require('./_helpers');

years.get('/', {
	summary: 'Get years',
	description: 'Get some year',
	tags: [ 'Misc' ],
}, function (req, res) {
	YearController.list(_helpers.sendResult(res), req.user);
});

module.exports = years;
