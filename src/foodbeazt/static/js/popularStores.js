var favStoreApp = angular.module('fbeaztAdmin');

favStoreApp.controller('popularStoresCtrl', function($scope, $http, $routeParams){
    $scope.stores         = [];
    $scope.search_results = [];
    $scope.searchText     = '';
    var FAV_URL           = '/api/popular_stores/';

    $scope.searchItems = function() {
        var text = $scope.searchText.trim();
        if(text.length < 3){
            $scope.search_results = [];
            return false;
        }
        $http({
            url: '/api/stores',
            method: 'GET',
            params: {"filter_text": $scope.searchText}
        })
        .success(function(d){
            var items     = [];
            for(var i     = 0; i < d.items.length; ++i){
                var item  = d.items[i];
                var found = $scope.stores.find(function(x){ return x._id.$oid == item._id.$oid; });
                if(!found){
                    items.push(item);
                }
            }
            $scope.search_results = items;
            $scope.total          = d.total;
        })
        .error(function(e){
            alert(e);
        });
    };

    $scope.resetSearch = function(){
        $scope.search_results = [];
    };

    $scope.addPopular = function(store_id){
        var found = $scope.search_results.find(function(x){ return x._id.$oid == store_id; });
        $scope.search_results.splice($scope.search_results.indexOf(found), 1);

        $http.post(FAV_URL+store_id).success(function(d){
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
        $http.get(FAV_URL+'-1').success(function(d){
            $scope.stores = d.items.sort(function(a,b){
                return a.no > b.no ? 1 : 0;
            });
            $scope.total = d.total;
        }).error(function(e){
            alert(e);
        });
    };

    $scope.removePopularDish = function(id){
        if(id && id != "-1"){
            $http.delete(FAV_URL+id).success(function(d){
                $scope.reloadPopular();
            }).error(function(e){
                alert(e);
                $scope.reloadPopular();
            });
        }
        return false;
    }

    $scope.updateSerialNo = function(id,no){
        if(id && id != '-1'){
            $http.put(FAV_URL+id,{
                no: no
            }).success(function(d){
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

