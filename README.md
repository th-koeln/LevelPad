# LevelPad [![Build status][travis-image]][travis-url] [![Test coverage][coveralls-image]][coveralls-url] [![Dependency Status][dependency-image]][dependency-url]

[travis-image]: https://img.shields.io/travis/fh-koeln/LevelPad.svg
[travis-url]: https://travis-ci.org/fh-koeln/LevelPad
[coveralls-image]: https://img.shields.io/coveralls/fh-koeln/LevelPad.svg
[coveralls-url]: https://coveralls.io/r/fh-koeln/LevelPad
[dependency-image]: https://david-dm.org/fh-koeln/LevelPad.png
[dependency-url]: https://david-dm.org/fh-koeln/LevelPad

Webapp zur Unterstützung einer Bewertung nach dem Niveaustufenmodell

**Status**: In Entwicklung.

## Niveaustufenmodell

> TODO

## Software components:

Implemented with the "MEAN-stack" (mongoDB, express, AngularJS, Node.js):

* Storage / Persistance / Cache:
[mongoDB](http://www.mongodb.org/) with
[mongoose](http://mongoosejs.com/)

* Backend stack:
[Node.js](http://nodejs.org/),
[express](http://expressjs.com/),
[acl](https://github.com/optimalbits/node_acl),
[Passport](http://passportjs.org/),
[helmet](https://github.com/evilpacket/helmet)

* Backend tests:
[mocha](https://github.com/visionmedia/mocha),
[should](https://github.com/visionmedia/should.js),
[supertest](https://github.com/visionmedia/supertest) and
[istanbul](https://github.com/gotwarlost/istanbul)

* Frontend stack:
[AngularJS](http://www.angularjs.org/),
[Bootstrap](http://getbootstrap.com/)

* Frontend tests:
TODO

## Heroku installation

Heroku version runs in production mode:

	heroku config:set NODE_ENV=production

## Commandline hints

*Run server:*

	npm run-script run

(will update this to use grunt or gulpjs soon...)

*Run server and auto restart on code change:*

	npm run-script run-auto

*Run tests*

	npm test

*Run tests with coverage report*

	npm run-script test-cov

*Push new version to heroku:*

	git push heroku master && heroku logs -t
