var popularDishApp = angular.module('fbeaztAdmin');

popularDishApp.controller('popularDishesCtrl', function($scope, $http, $routeParams){
	$scope.products = [];
	$scope.search_results = [];
	$scope.searchText = "";

  $scope.searchItems = function() {
    var text = $scope.searchText.trim();
    if(text.length < 3){
      $scope.search_results = [];
      return false;
    }
    $http.get('/api/products/-1').success(function(d){
        $scope.search_results = d.items;
        $scope.total = d.total;
    }).error(function(e){
        alert(e);
    });
  };

  $scope.addPopular = function(product_id){
    $http.post('/api/popular_items/'+product_id).success(function(d){
      if(d.status != "success"){
        console.error(d);
        alert(d);
      }else{
        $scope.reloadPopular();
      }
    }).error(function(e){
        alert(e);
    })
  };

	$scope.reloadPopular = function(){
    $http.get('/api/popular_items/-1').success(function(d){
        $scope.products = d.items;
        $scope.total = d.total;
    }).error(function(e){
        alert(e);
    });
	};

	$scope.removePopularDish = function(id){
		if(id && id != "-1"){
			$http.delete('/api/popular_items/'+id).success(function(d){
        $scope.reloadPopular();
			}).error(function(e){
				alert(e);
				$scope.reloadPopular();
			});
		}
		return false;
	}

  $scope.reloadPopular();
});
