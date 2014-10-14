var fbeaztAdmin = angular.module('fbeaztAdmin',['ngRoute', 'ngSanitize', 'ngCookies', 'checklist-model', 'fbFilters', 'angularFileUpload'])

var menuItems = []
menuItems.push({"title": "Main", "heading": true })
menuItems.push({"title": "Tenant", "heading": false, "url": "/tenant", "icon": "fa fa-users", "templateUrl": '/static/templates/admin/tenant/list.html'})
menuItems.push({"title": "User", "heading": false, "url": "/user", "icon": "fa fa-user", "templateUrl": '/static/templates/admin/user/list.html'})
menuItems.push({"title": "Store", "heading": false, "url": "/store", "icon": "fa fa-building", "templateUrl": '/static/templates/admin/store/list.html'})
menuItems.push({"title": "Product", "heading": false, "url": "/product", "icon": "fa fa-apple", "templateUrl": '/static/templates/admin/product/list.html'})

var custom_routes = []
custom_routes.push({"title": "Manage Tenant", "heading": false, "url": "/tenant/:id", "templateUrl": '/static/templates/admin/tenant/manage.html'})
custom_routes.push({"title": "Manage User", "heading": false, "url": "/user/:id", "templateUrl": '/static/templates/admin/user/manage.html'})
custom_routes.push({"title": "Manage Store", "heading": false, "url": "/store/:id", "templateUrl": '/static/templates/admin/store/manage.html'})
custom_routes.push({"title": "Manage Product", "heading": false, "url": "/product/:store_id/:id", "templateUrl": '/static/templates/admin/product/manage.html'})

fbeaztAdmin.config(['$routeProvider', function($routeProvider){
    var items = menuItems.concat(custom_routes)

	for(var i=0; i < items.length; ++i){
        var item = items[i]
        if(item.heading) continue
        $routeProvider.when(item.url,{
        		action: item.templateUrl,
        		title : item.title
        	})
    }

	$routeProvider.otherwise({
		redirectTo: '/'
	})
}]).run(function($location, $rootScope, $route){
	$rootScope.pageTitle = function() {
	    var title = $route.current ? $route.current.title : null
	    return title || "FoodBeazt :: Admin :: Home"
	}
    $rootScope.location = $location
	$rootScope.$on('$routeChangeSuccess', function( event, current, previous ){
    })
})


fbeaztAdmin.controller('mainCtrl', function($route, $scope, $http, $routeParams){
	$scope.app = {}
	$scope.app.viewAnimation = true
	$scope.app.page = {}
	$scope.app.layout = {}
	$scope.app.user = window.app_user
	$scope.app.layout.isFixed = true
	$scope.app.layout.isCollapsed = false
	$scope.app.layout.top_nav_url = "static/templates/admin/top-navbar.html"
	$scope.app.layout.aside_nav_url = "static/templates/admin/aside-navbar.html"
	$scope.app.layout.content_url = ""
    $scope.menuItems = menuItems

	render = function($currentRoute){
	    var content_url = $route.current.action
	    $scope.app.layout.content_url = content_url
	}

	$scope.$on("$routeChangeSuccess", function( $currentRoute, $previousRoute ){
	    render($currentRoute)
    })
})
