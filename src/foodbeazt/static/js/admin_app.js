var fbeaztAdmin = angular.module('fbeaztAdmin',['ngRoute', 'ngCookies', 'fbFilters'])

var menuItems = []
menuItems.push({"title": "Main", "heading": true })
menuItems.push({"title": "Tenant", "heading": false, "url": "/tenant", "icon": "fa fa-users", "templateUrl": '/static/templates/admin/tenant/list.html'})
menuItems.push({"title": "User", "heading": false, "url": "/user", "icon": "fa fa-user", "templateUrl": '/static/templates/admin/user/list.html'})
menuItems.push({"title": "Store", "heading": false, "url": "/store", "icon": "fa fa-building", "templateUrl": '/static/templates/admin/storeList.html'})

var custom_routes = []
custom_routes.push({"title": "Manage Tenant", "heading": false, "url": "/tenant/:id", "templateUrl": '/static/templates/admin/tenant/manage.html'})
custom_routes.push({"title": "Manage User", "heading": false, "url": "/user/:id", "templateUrl": '/static/templates/admin/user/manage.html'})

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
    $rootScope.location = $location;
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

fbeaztAdmin.controller('tenantListCtrl', function($route, $scope, $http, $routeParams){
	$scope.tenants = []
    $http.get('/api/tenants').success(function(d){
        $scope.tenants = d
    })
})

fbeaztAdmin.controller('tenantDetailCtrl', function($scope, $http, $routeParams, $location){
	$scope.model = {}
	$http.get('/api/tenant/'+ $routeParams.id).success(function(d){
            if(!d._id || !d._id.$oid)
                d._id = { "$oid": "-1" }
            $scope.model = d
    	}).error(function(e){
    	    alert('Error while fetching tenant details')
        	$location.path('/tenant')
    	})

	$scope.save = function(){
	    //console.log($scope.model)

	    if($scope.frmTenant.$invalid){
	        alert("Form contains invalid data\n\nPlease check the form and submit again")
	        return
	    }

	    if($scope.model._id.$oid == "-1"){
	        $scope.model._id = null
            res = $http.post('/api/tenant/-1', $scope.model)
        }else{
            res = $http.put('/api/tenant/'+ $scope.model._id.$oid, $scope.model)
        }

        res.success(function(data){
               if(data.status == "success"){
                   $location.path('/tenant')
               }else{
                   alert(data.message)
               }
           })
           .error(function(e){
               alert(e)
               console.log(e)
           })
	}
})

fbeaztAdmin.controller('userListCtrl', function($route, $scope, $http, $routeParams){
	$scope.users = []
    $http.get('/api/users').success(function(d){
        $scope.users = d
    })
})

fbeaztAdmin.controller('userDetailCtrl', function($scope, $http, $routeParams, $location){
	$scope.model = {}
	$http.get('/api/user/'+ $routeParams.id).success(function(d){
        if(!d._id || !d._id.$oid)
            d._id = { "$oid": "-1" }
        $scope.model = d
	}).error(function(e){
	    alert('Error while fetching user details')
    	$location.path('/user')
	})

	$scope.save = function(){
	    //console.log($scope.model)

	    if($scope.frmTenant.$invalid){
	        alert("Form contains invalid data\n\nPlease check the form and submit again")
	        return
	    }

	    if($scope.model._id.$oid == "-1"){
	        $scope.model._id = null
            res = $http.post('/api/user/-1', $scope.model)
        }else{
            res = $http.put('/api/user/'+ $scope.model._id.$oid, $scope.model)
        }

        res.success(function(data){
               if(data.status == "success"){
                   $location.path('/user')
               }else{
                   alert(data.message)
               }
           })
           .error(function(e){
               alert(e)
               console.log(e)
           })
	}
})