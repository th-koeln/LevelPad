angular.module('levelPad').factory('Grade', [function() {
	// Chart.js Options
		
	
	function objectFindByKey(array, key, value) {
		for (var i = 0; i < array.length; i++) {
			if (array[i][key] === value) {
				return array[i];
			}
		}
		return null;
	};
	
	function inGradeSystem(grade){
		if(grade>4){ return 5 }
		else if(grade <= 4 && grade > 3.85) { return 4 }
		else if(grade <= 3.85 && grade > 3.5) { return 3.7 }
		else if(grade <= 3.5 && grade > 3.15) { return 3.3 }
		else if(grade <= 3.15 && grade > 2.85) { return 3 }
		else if(grade <= 2.85 && grade > 2.5) { return 2.7 }
		else if(grade <= 2.5 && grade > 2.15) { return 2.3 }
		else if(grade <= 2.15 && grade > 1.85) { return 2 }
		else if(grade <= 1.85 && grade > 1.5) { return 1.7 }
		else if(grade <= 1.5 && grade > 1.15) { return 1.3 }
		else if(grade <= 1.15) { return 1 }
	}
	
	function absoluteGrade($scope){
		var absGrade = 0;
		var weightSum = 0;
		angular.forEach($scope.subject.tasks, function(task) {
			var countMin = 0;
			var evaluation = objectFindByKey($scope.member.evaluations, 'task', task._id);

			if (evaluation){
				weightSum += task.weight;
				var level = objectFindByKey(task.levels, '_id', evaluation.level);
				angular.forEach(task.levels, function(level) {
					if(level.isMinimum == true){
						countMin +=1;
					}
				});
				if(level){
					task.level = level;
				}
				if(task.level.isMinimum == true){
					if(countMin!=1){
						absGrade+= (3/(countMin-1) * (task.level.rank -1) +1) * task.weight;
					}else{
						absGrade+= 1 * task.weight;
					}
				}
				else{
					absGrade+= 5 * task.weight;
				}
			}
			if(!evaluation){
				weightSum += task.weight;
				absGrade+= 5 * task.weight;
			}
		});
		if(weightSum!=0){
			absGrade = absGrade / weightSum;
		}else{
			absGrade = 5;	
		}
		return absGrade
	};

	function relativeGrade($scope){
		var relGrade = 0;
		var weightSum = 0;
		angular.forEach($scope.subject.tasks, function(task) {
			var countMin = 0;
			var evaluation = objectFindByKey($scope.member.evaluations, 'task', task._id);

			if (evaluation){
				weightSum += task.weight;
				var level = objectFindByKey(task.levels, '_id', evaluation.level);
				angular.forEach(task.levels, function(level) {
					if(level.isMinimum == true){
						countMin +=1;
					}
				});
				if(level){
					task.level = level;
				}
				if(task.level.isMinimum == true){
					if(countMin!=1){
						relGrade+= (3/(countMin-1) * (task.level.rank -1) +1) * task.weight;
					}else{
						relGrade+= 1 * task.weight;
					}
				}
				else{
					relGrade+= 5 * task.weight;
				}
			}
		});

		if (weightSum!=0){
			relGrade = relGrade / weightSum;
		}else{
			relGrade=5;	
		}
		return relGrade
	};
	 return  {
		 prepareMember: function prepareMember($scope) {
			$scope.relGrade = Math.round( relativeGrade($scope) * 100) / 100;
			$scope.absGrade = Math.round( absoluteGrade($scope) * 1000) / 1000;
			$scope.absGrade = inGradeSystem($scope.absGrade);
			if($scope.subject.tasks.length==0){
				$scope.member._artefacts = [
					{
						title:'Artefakte',
						value: 0,
						color: '#77cc00',
						highlight: '#88dd11'
					},
					{
						title:'Rest',
						value: 1,
						color:'lightgray',
						highlight: 'lightgray'
					}
				];	
			}else{
				$scope.member._artefacts = [
					{
						title:'Artefakte',
						value: $scope.member.evaluations.length,
						color: '#77cc00',
						highlight: '#88dd11'
					},
					{
						title:'Rest',
						value: $scope.subject.tasks.length - $scope.member.evaluations.length,
						color:'lightgray',
						highlight: 'lightgray'
					}
				];
			}
			$scope.member._absGrade = [
				{
					title:'Note',
					value: 4-($scope.absGrade-1),
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.absGrade-1,
					color: 'lightgray',
					highlight: 'lightgray'
				}
			];
			$scope.member._relGrade = [
				{
					title:'Note',
					value: 4-($scope.relGrade-1),
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.relGrade-1,
					color: 'lightgray',
					highlight: 'lightgray'
				}
			];
			$scope.member._noneAbsGrade = [
				{
					title:'Note',
					value: 0,
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.absGrade-1,
					color: '#E886B7',
					highlight: '#E886B7'
				}
			];
			$scope.member._noneRelGrade = [
				{
					title:'Note',
					value: 0,
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.relGrade-1,
					color: '#E886B7',
					highlight: '#E886B7'
				}
			];
			angular.forEach($scope.subject.tasks, function(task) {
				task._taskWeight = [
					{
						title:'Task',
						value: task.weight,
						color: '#77cc00',
						highlight: '#88dd11'
					},
					{
						title:'Rest',
						value: 100- task.weight,
						color:'lightgray',
						highlight: 'lightgray'
					}
				];
				task.level = null;
				var evaluation = objectFindByKey($scope.member.evaluations, 'task', task._id);
				if (evaluation){
					var level = objectFindByKey(task.levels, '_id', evaluation.level);
					if(level){
						task.level = level;
					}else{
						task.level = null;
					}
				}

			});
		},
		 prepareMemberList: function prepareMemberList($scope, member) {
			$scope.member = member;
			$scope.relGrade = Math.round( relativeGrade($scope) * 100) / 100;
			$scope.absGrade = Math.round( absoluteGrade($scope) * 1000) / 1000;
			$scope.absGrade = inGradeSystem($scope.absGrade);
			if($scope.subject.tasks.length==0){
				$scope.member._artefacts = [
					{
						title:'Artefakte',
						value: 0,
						color: '#77cc00',
						highlight: '#88dd11'
					},
					{
						title:'Rest',
						value: 1,
						color:'lightgray',
						highlight: 'lightgray'
					}
				];	
			}else{
				$scope.member._artefacts = [
					{
						title:'Artefakte',
						value: $scope.member.evaluations.length,
						color: '#77cc00',
						highlight: '#88dd11'
					},
					{
						title:'Rest',
						value: $scope.subject.tasks.length - $scope.member.evaluations.length,
						color:'lightgray',
						highlight: 'lightgray'
					}
				];
			}
			$scope.member._absGrade = [
				{
					title:'Note',
					value: 4-($scope.absGrade-1),
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.absGrade-1,
					color: 'lightgray',
					highlight: 'lightgray'
				}
			];
			$scope.member._relGrade = [
				{
					title:'Note',
					value: 4-($scope.relGrade-1),
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.relGrade-1,
					color: 'lightgray',
					highlight: 'lightgray'
				}
			];
			$scope.member._noneAbsGrade = [
				{
					title:'Note',
					value: 0,
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.absGrade-1,
					color: '#E886B7',
					highlight: '#E886B7'
				}
			];
			$scope.member._noneRelGrade = [
				{
					title:'Note',
					value: 0,
					color: '#77cc00',
					highlight: '#88dd11'
				},
				{
					title:'Rest',
					value: $scope.relGrade-1,
					color: '#E886B7',
					highlight: '#E886B7'
				}
			];
			angular.forEach($scope.subject.tasks, function(task) {
				task._taskWeight = [
					{
						title:'Task',
						value: task.weight,
						color: '#77cc00',
						highlight: '#88dd11'
					},
					{
						title:'Rest',
						value: 100- task.weight,
						color:'lightgray',
						highlight: 'lightgray'
					}
				];

				var evaluation = objectFindByKey($scope.member.evaluations, 'task', task._id);
				if (evaluation){
					var level = objectFindByKey(task.levels, '_id', evaluation.level);
					if(level){
						task.level = level;
					}
				}

			});
		}
	 }
}]);