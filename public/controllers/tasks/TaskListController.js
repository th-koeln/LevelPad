/* global angular, alert */

angular.module('levelPad').controller('TaskListController', [
	'$scope', '$routeParams', '$location', '$log', 'Module', 'Subject', 'Task', 'DialogService', 'CurrentModule', 'CurrentSubject', 'CurrentTask',
	function ($scope, $routeParams, $location, $log, Module, Subject, Task, DialogService, CurrentModule, CurrentSubject, CurrentTask) {

	'use strict';
	$scope.module = CurrentModule;
	$scope.subject = CurrentSubject;
    $scope.task = CurrentTask;

	$scope.openTasks = function(module, subject) {
		if (module && subject) {
			$location.path('/' + subject.module.slug + '/' + subject.slug + '/tasks');
		} else {
			$log.warn('Could not open tasks because module or slug are undefined!');
		}
	};

	$scope.openTask = function(task) {
		$location.path('/' + task.subject.module.slug + '/' + task.subject.slug + '/tasks/' + task.slug);
	};

	$scope.openTeams = function(subject) {
		$location.path('/' + subject.module.slug + '/' + subject.slug + '/teams');
	};

	$scope.openStudents = function(subject) {
		$location.path('/' + subject.module.slug + '/' + subject.slug + '/students');
	};

	$scope.openSettings = function(subject) {
		$location.path('/' + subject.module.slug + '/' + subject.slug + '/settings');
	};

	$scope.update = function() {

	};
	$scope.update();

      $scope.showCreateDialog = function() {
			var dialog = new DialogService('/tasks/new');
			dialog.scope.task = new Task();
			dialog.scope.submit = function() {
				dialog.scope.task.$save(function() {
					dialog.submit();
					$scope.update();
				}, function() {
					alert('Fehler!');
				});
			};
			dialog.open();
		};

	$scope.showEditDialog = function(task) {
		$scope.task = angular.copy(task);
		$('#edit').modal();
	};

	$scope.showDeleteDialog = function(task) {
		$scope.task = angular.copy(task);
		$('#delete').modal();
	};    
        
	$scope.task = [
		{
			title: 'Hallo'
		}
	];

	$scope.levels = [
		{
			title: 'Hallo'
		}
	];
}]);
