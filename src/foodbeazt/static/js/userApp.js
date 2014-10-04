var userApp = angular.module('fbeaztAdmin')

userApp.controller('userListCtrl', function($route, $scope, $http, $routeParams, $window){
	$scope.users = []

	$scope.reloadUsers = function(){
        $http.get('/api/users').success(function(d){
            $scope.users = d
        })
    }

    $scope.reloadUsers()

	$scope.deleteUser = function(id){
	    $http.delete('/api/user/'+id).success(function(d){
	        $scope.reloadUsers()
	    }).error(function(e){
             alert(e)
             $scope.reloadUsers()
        })
	}
})

userApp.controller('userDetailCtrl', function($scope, $http, $routeParams, $location){
	$scope.model = {}
	$scope.roles = [{'id': 'member', 'text': 'Member'}, {'id': 'tenant_admin', 'text': 'Tenant Admin'}]

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

	    if($scope.frmUser.$invalid){
	        alert("Form contains invalid data\n\nPlease check the form and submit again")
	        return
	    }

        var item = angular.copy($scope.model)

	    if(item._id.$oid == "-1"){
	        item._id = null
            res = $http.post('/api/user/-1', item)
        }else{
            res = $http.put('/api/user/'+ item._id.$oid, item)
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