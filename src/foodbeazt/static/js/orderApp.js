var orderApp = angular.module('fbeaztAdmin')

orderApp.controller('orderListCtrl', function($scope, $http, $routeParams){
	$scope.stores  = []
	$scope.orders = []
	$scope.selected_store = null
	$scope.selected_store_name = 'Select Store'

	$scope.reloadOrder = function(){
	    if(!$scope.selected_store) return
        $http.get('/api/orders/',{ params: { 'store_id': $scope.selected_store } }).success(function(d){
            $scope.orders = d.items
            $scope.total = d.total
        }).error(function(e){
            alert(e)
        })
	}

	$scope.reloadStore = function(){
        $http.get('/api/stores').success(function(d){
            $scope.stores = d
            if($routeParams.store_id)
                $scope.setStore($routeParams.store_id)
            else if($scope.stores && $scope.stores.length > 0)
                $scope.setStore($scope.stores[0]._id.$oid)
            if(!$scope.stores || $scope.stores.length == 0) {
                $scope.stores = []
                $scope.stores.push({'_id': {"$oid": ''}, 'name': 'No stores available!'})
            }

        }).error(function(e){
            alert(e)
        })
    }

    $scope.reloadStore()

    $scope.setStore = function(store_id){
        if(!store_id || store_id == '-1' || store_id == '') return
         $scope.selected_store = store_id

         for(var i=0; i < $scope.stores.length; ++i){
            var s = $scope.stores[i]
            if(s._id.$oid == store_id){
                $scope.selected_store_name = s.name
            }
         }

         $scope.reloadOrder()
         return false
    }
})