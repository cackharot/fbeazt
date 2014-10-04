var tenantApp = angular.module('fbeaztAdmin')

tenantApp.controller('tenantListCtrl', function($route, $scope, $http, $routeParams){
	$scope.tenants = []
    $http.get('/api/tenants').success(function(d){
        $scope.tenants = d
    })
})

tenantApp.controller('tenantDetailCtrl', function($scope, $http, $routeParams, $location){
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

        var item = angular.copy($scope.model)

	    if(item._id.$oid == "-1"){
	        item._id = null
            res = $http.post('/api/tenant/-1', item)
        }else{
            res = $http.put('/api/tenant/'+ item._id.$oid, item)
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