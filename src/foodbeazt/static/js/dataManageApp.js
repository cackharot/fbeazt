var userApp = angular.module('fbeaztAdmin');

userApp.controller('dataManageCtrl', function($route, $scope, $http, $routeParams, $window){
  $scope.model = [];

  $scope.reloadData = function() {
    $http.get('/api/data_manage').success(function(d){
        $scope.model = d;
    });
  };

  $scope.reloadData();

  $scope.exportData = function() {
    $http.post('/api/data_manage').success(function(id) {
      $scope.reloadData()
    });

    return false;
  };
});

