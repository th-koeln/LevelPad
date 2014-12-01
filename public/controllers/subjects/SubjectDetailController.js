/* global alert */

angular.module('levelPad').controller('SubjectDetailController', [
	'$scope', '$routeParams', '$location', '$http', '$log', 'DialogService', 'Module', 'Subject', 'CurrentModule', 'CurrentSubject', 'ChartOption',
	function ($scope, $routeParams, $location, $http, $log, DialogService, Module, Subject, CurrentModule, CurrentSubject, ChartOption) {

		'use strict';

		$scope.$location = $location;

		$http.get('/api/years').success(function(years) {
			$scope.years = years;
		});

		$http.get('/api/semesters').success(function(semesters) {
			$scope.semesters = semesters;
		});

		$http.get('/api/modules').success(function(modules) {
			$scope.modules = modules;
		});

		function zeroize(x) {
			return (x < 10) ? '0' + x : x;
		}

		function getExpireDates() {
			var dates = [],
				today, actualDate, todayInTwoWeeks;

			actualDate = new Date(),
			today = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate(), 23, 59, 59);
			todayInTwoWeeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);

			dates.push({
				name: 'Unbeschränkt',
				timestamp: 0
			});

			while (today <= todayInTwoWeeks) {
				dates.push({
					name: zeroize(today.getDate()) + '.' +  zeroize(today.getMonth() + 1) + '.' + today.getFullYear(),
					timestamp: today.getTime()
				});
				today.setDate(today.getDate() + 1);
			}

			return dates;
		}
		$scope.expireDates = getExpireDates();

		$scope.subject = $scope.subject || CurrentSubject || new Subject();

		$scope.update = function(newSubject) {
			if (newSubject) {
				$scope.subject = newSubject;
			}

			if ($scope.subject.registrationPassword === undefined) {
				$scope.subject.registrationPassword = generatePassword();
				$scope.subject._registrationPasswordCheck = 'inactive';
			} else if ( $scope.subject.registrationPassword === '') {
				$scope.subject._registrationPasswordCheck = 'inactive';
			} else {
				$scope.subject._registrationPasswordCheck = 'active';
			}

			if ($scope.subject.registrationActive === true) {
				var oldDate = new Date($scope.subject.registrationExpiresAt), dateObject, existingDateObject;

				existingDateObject = objectFindByKey($scope.expireDates, 'timestamp', oldDate.getTime());

				if (!existingDateObject) {
					dateObject = {
						name: zeroize(oldDate.getDate()) + '.' +  zeroize(oldDate.getMonth() + 1) + '.' + oldDate.getFullYear(),
						timestamp: oldDate.getTime()
					};
					$scope.expireDates.push(dateObject);
					$scope.subject.registrationExpiresAt = dateObject;
				} else {
					$scope.subject.registrationExpiresAt = existingDateObject;
				}

				$scope.expireDates.sort(function(a, b) {
					return a.timestamp - b.timestamp;
				});
				$scope.subject.registrationActive = 'active';
			} else if ( $scope.subject.registrationActive === false ) {
				$scope.subject.registrationExpiresAt = $scope.expireDates[0];
				$scope.subject.registrationActive = 'inactive';
			} else if ( $scope.subject.registrationActive === undefined ) {
				$scope.subject.registrationExpiresAt = $scope.expireDates[0];
				$scope.subject.registrationActive = 'active';
			}
		};

		if ($scope.subject.$promise) {
			$scope.subject.$promise.then(function() {
				$scope.update();
			});
		} else {
			$scope.update();
		}

		function generatePassword() {
			var password = '',
				temp;

			for(var i = 0; i < 10; i++) {
				temp = 0;
				while(!((temp > 48 && temp < 57) || (temp > 65 && temp < 90) || (temp > 97 && temp < 122))) {
					temp = Math.floor(Math.random() * 74) + 48;
				}
				password += String.fromCharCode(temp);
			}

			return password;
		}

		// Source: http://stackoverflow.com/a/11477986
		function objectFindByKey(array, key, value) {
			for (var i = 0; i < array.length; i++) {
				if (array[i][key] === value) {
					return array[i];
				}
			}
			return null;
		}

		$scope.generatePassword = function() {
			$scope.subject.registrationPassword = generatePassword();
		};

		if (!$scope.submit) {
			$scope.submit = function () {
				var module = $scope.subject.module;
				delete $scope.subject.module;
				$scope.subject.$save({module: module.slug}, function() {
					$scope.update();
				}, function () {
					alert('Error!');
				});
			};
		}

		if (!$scope.delete) {
			$scope.delete = function () {
				$scope.subject.$delete({module: $scope.subject.module.slug}, function() {
					$scope.update();
				}, function () {
					alert('Error!');
				});
			};
		}

		if (!$scope.showEditDialog) {
			$scope.showEditDialog = function (subject) {
				var dialog = new DialogService('/subjects/:subject/edit');
				dialog.scope.subject = angular.copy(subject);
				dialog.scope.submit = function() {
					var module = dialog.scope.subject.module;
					delete dialog.scope.subject.module;

					if (dialog.scope.subject.registrationExpiresAt) {
						dialog.scope.subject.registrationExpiresAt = dialog.scope.subject.registrationExpiresAt.timestamp;
					}
					dialog.scope.subject.year = dialog.scope.subject.year.year;
					dialog.scope.subject.semester = dialog.scope.subject.semester.name;

					if (dialog.scope.subject.registrationActive === 'inactive') {
						dialog.scope.subject.registrationActive = 0;
						dialog.scope.subject.registrationExpiresAt = null;
					} else {
						dialog.scope.subject.registrationActive = 1;
					}

					if (dialog.scope.subject._registrationPasswordCheck === 'inactive') {
						dialog.scope.subject.registrationPassword = '';
					}

					delete dialog.scope.subject._registrationPasswordCheck;

					dialog.scope.subject.$save({module: module.slug}, function(newSubject) {
						dialog.submit();
						$scope.update(newSubject);
					}, function () {
						alert('Fehler!');
					});
				};
				dialog.scope.showDeleteDialog = function () {
					dialog.cancel();
					$scope.showDeleteDialog(subject);
				};
				dialog.open();
			};
		}

		if (!$scope.showDeleteDialog) {
			$scope.showDeleteDialog = function (subject) {
				var dialog = new DialogService('/subjects/:subject/delete');
				dialog.scope.subject = angular.copy(subject);
				dialog.scope.delete = function () {
					dialog.scope.subject.$delete({module: dialog.scope.subject.module.slug}, function() {
						dialog.submit();
						$scope.update();
					}, function () {
						alert('Fehler!');
					});
				};
				dialog.open();
			};
		}

		//Pie Chart Magic
		$scope.options = ChartOption;
		// Chart.js Data
		$scope.data = [
		  {
			title:'Learning Outcome',
			value: 20,
			color: '#77cc00',
			highlight: '#88dd11'
		  },
		  {
			title:'Rest',
			value: 100-20,
			color:'lightgray',
			highlight: 'lightgray'
		  }
		];

}]);
