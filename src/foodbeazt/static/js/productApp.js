var productApp = angular.module('fbeaztAdmin')

productApp.controller('productListCtrl', function($scope, $http, $routeParams){
	$scope.stores  = []
	$scope.products = []
	$scope.selected_store = null
	$scope.selected_store_name = 'Select Store'

	$scope.reloadProduct = function(){
	    if(!$scope.selected_store) return
        $http.get('/api/products/'+$scope.selected_store).success(function(d){
            $scope.products = d
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

            $scope.reloadProduct()
        }).error(function(e){
            alert(e)
        })
    }

    $scope.reloadStore()

    $scope.setStore = function(store_id){
        if(!store_id) return
         $scope.selected_store = store_id

         for(var i=0; i < $scope.stores.length; ++i){
            var s = $scope.stores[i]
            if(s._id.$oid == store_id){
                $scope.selected_store_name = s.name
            }
         }

         $scope.reloadProduct()
         return false
    }

	$scope.deactivateProduct = function(id){
		if(id && id != "-1"){
			$http.delete('/api/product/'+$scope.selected_store+'/'+id).success(function(d){
	            $scope.reloadProduct()
			}).error(function(e){
				alert(e)
				$scope.reloadProduct()
			})
		}
		return false
	}

	$scope.activateProduct = function(id){
	    if(id && id != "-1"){
            $http.put('/api/product/activate/'+$scope.selected_store+'/'+id).success(function(d){
                $scope.reloadProduct()
            }).error(function(e){
                alert(e)
                $scope.reloadProduct()
            })
        }
        return false
	}
})

productApp.controller('productDetailCtrl', function($scope, $routeParams, $location, $http){
	var id = $routeParams.id || -1;
	$scope.store_id = $routeParams.store_id || -1;

	$scope.model = {}
    $scope.food_types = [{'id': 'veg', 'text': 'Vegetarian'},
                        {'id': 'non-veg', 'text': 'Non-Vegetarian'}]

    $http.get('/api/product/'+ $scope.store_id + '/' + id).success(function(d){
        if(!d._id || !d._id.$oid)
            d._id = { "$oid": "-1" }
        $scope.model = d
    }).error(function(e){
        alert('Error while fetching product details')
        $location.path('/product')
    })

    $scope.save = function(){
        if($scope.frmProduct.$invalid){
            alert("Form contains invalid data\n\nPlease check the form and submit again")
            return
        }

        var item = angular.copy($scope.model)

        if(item._id.$oid == "-1"){
            item._id = null
            res = $http.post('/api/product/'+ $scope.store_id + '/-1', item)
        }else{
            res = $http.put('/api/product/'+ $scope.store_id + '/'+ item._id.$oid, item)
        }

        res.success(function(data){
               if(data.status == "success"){
                   $location.path('/product')
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