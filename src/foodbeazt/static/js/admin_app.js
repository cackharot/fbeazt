var fbeaztAdmin = angular.module('fbeaztAdmin',['ngRoute', 'ngCookies'])

fbeaztAdmin.config(['$routeProvider', function($routeProvider){
	$routeProvider.
	when('/',{
    		controller: 'mainCtrl',
    		templateUrl: '/static/templates/admin/main.html'
    	}).
	when('/tenant',{
		controller: 'tenantCtrl',
		templateUrl: '/static/templates/admin/tenantList.html'
	}).
	when('/tenant/:id',{
		controller: 'tenantDetailCtrl',
		templateUrl: '/static/templates/admin/tenantManager.html'
	}).
	otherwise({
		redirectTo: '/'
	})
}])

fbeaztAdmin.controller('mainCtrl', function($scope,$http){
	$scope.app = {}
	$scope.app.layout = {}
	$scope.app.layout.isFixed = true;
	$scope.app.layout.isCollapsed = false;
	$scope.app.layout.top_nav_url = "static/templates/admin/top-navbar.html"
	$scope.app.layout.aside_nav_url = "static/templates/admin/aside-navbar.html"
	console.log($scope.app)
})

fbeaztAdmin.controller('SidebarController', function($scope,$http){
    $scope.inSubmen = false
    $scope.menuItems = []
    $scope.menuItems.push({"title": "Main", "heading": true})
    $scope.menuItems.push({"title": "Tenant", "heading": false, "url": "#/tenant", "icon": "fa fa-users"})
})

fbeaztAdmin.controller('tenantCtrl', function($scope,$http){
	$scope.tenants = []
	$http.get('/api/tenants').success(function(d){
		console.log(d)
		$scope.tenants = d
	})
})

fbeaztAdmin.controller('tenantDetailCtrl', function($scope,$http){
	$scope.model = []
	$http.get('/api/tenant/'+ $scope.id).success(function(d){
		console.log(d)
		$scope.model = d
	})
})