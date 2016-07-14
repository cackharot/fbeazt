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
    $http({
        url: '/api/products/-1',
        method: 'GET',
        params: {"filter_text": $scope.searchText}
      })
      .success(function(d){
        var items = [];
        for(var i=0; i < d.items.length; ++i){
          var item = d.items[i];
          var found = $scope.products.find(function(x){ return x._id.$oid == item._id.$oid; });
          if(found == null){
            items.push(item);
          }
        }
        $scope.search_results = items;
        $scope.total = d.total;
      })
      .error(function(e){
        alert(e);
      });
  };

  $scope.resetSearch = function(){
    $scope.search_results = [];
  };

  $scope.addPopular = function(product_id){
    var found = $scope.search_results.find(function(x){ return x._id.$oid == product_id; });
    $scope.search_results.splice($scope.search_results.indexOf(found), 1);

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
