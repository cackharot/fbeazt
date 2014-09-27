var storeApp = angular.module('storeApp',['ngRoute', 'ngCookies'])

storeApp.config(['$routeProvider', function($routeProvider){
	$routeProvider.
	when('/store',{
		controller: 'lstCtrl',
		templateUrl: '/static/templates/storeList.html'
	}).
	when('/store/:id',{
		controller: 'detailCtrl',
		templateUrl: '/static/templates/storeManage.html'
	}).
	otherwise({
		redirectTo: '/store'
	})
}])

storeApp.run(function($rootScope,$location,$cookieStore,$http){
	var auth_data = $cookieStore.get('auth_data')
	//console.log(auth_data)
	if(auth_data){
		$http.defaults.headers.common['Authorization'] = 'Basic ' + auth_data
	}
})

storeApp.controller('lstCtrl', function($scope,$http){
	$scope.stores = []
	$http.get('/api/stores').success(function(d){
		console.log(d)
		$scope.stores = d
	})

	$scope.deleteStore = function(id){
		if(id && id != "-1"){
			$http.delete('/api/store/'+id).success(function(d){
			}).error(function(e){
				console.log("error:" + e)
			})
			return false
		}
	}
})

storeApp.controller('detailCtrl', function($scope, $routeParams, $location, $http){
	var id = $routeParams.id || -1;
	
	$scope.model = {}
	
	$http.get('/api/store/' + id).success(function(d){
		console.log(d)
		if(d)
			$scope.model = d
	})
	
	$scope.saveStore = function(e){
		var item = $scope.model;
		if(item._id){		
			$http.post('/api/store/' + item._id, item).success(function(d){
				console.log(d)
			})	
		}else{			
			$http.put('/api/store/' + item._id, item).success(function(d){
				console.log(d)
			})
		}
		
		$location.path('/store')
		return false
	}
})