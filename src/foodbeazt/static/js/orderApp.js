var orderApp = angular.module('fbeaztAdmin')

orderApp.controller('orderListCtrl', function($scope, $http, $routeParams){
	$scope.stores  = []
	$scope.orders = []
    $scope.searchText="";
    $scope.filter_pending=false;
    $scope.filter_preparing=false;
    $scope.filter_progress=false;
    $scope.filter_delivered=false;
    $scope.filter_cancelled=false;
	$scope.selected_store = null
	$scope.selected_store_name = 'Select Store'
    $scope.page_no = 1;
    $scope.page_size = 5;
    $scope.next = null;
    $scope.previous = null;
    $scope.load_url = '/api/orders';

	$scope.reloadOrder = function(url){
	    if(!$scope.selected_store) return;
        if(url === undefined || url === null){
            $scope.page_no = 1;
            $scope.page_size = 5;
            $scope.next = null;
            $scope.previous = null;
        }
        var order_status = [];
        if($scope.filter_pending) order_status.push('PENDING');
        if($scope.filter_preparing) order_status.push('PREPARING');
        if($scope.filter_progress) order_status.push('PROGRESS');
        if($scope.filter_delivered) order_status.push('DELIVERED');
        var params = {
            'store_id': $scope.selected_store,
            'filter_text': $scope.searchText,
            'order_status': order_status.join(','),
            'page_no': $scope.page_no,
            'page_size': $scope.page_size
        };
        $http.get(url || $scope.load_url,{ params: params })
        .success(function(d){
            $scope.orders = d.items;
            $scope.total = d.total;
            $scope.page_no = d.page_no;
            $scope.page_count = Math.ceil(d.total/$scope.page_size);
            $scope.next = d.next;
            $scope.previous = d.previous;
        }).error(function(e){
            alert(e);
        });
	};

    $scope.navigate = function(url){
        $scope.reloadOrder(url);
        return false;
    };

    $scope.updateStatus = function(item,status){
        if(item.status == 'DELIVERED'){
            alert("You cannot change already delivered order!");
            return false;
        }
        if(status == 'DELIVERED'){
            if(!confirm("Are you sure the order is delivered successfully?")){
                return false;
            }
        }
        $http.post('/api/order_status/'+item._id.$oid,{'status':status})
        .success(function(d){
            item.status = status;
        }).error(function(e){
            alert(e);
        });
    }

	$scope.reloadStore = function(){
        $http.get('/api/stores',{params:{'page_size':200}}).success(function(d){
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

    $scope.resetSearch = function(){
        $scope.searchText="";
        $scope.filter_pending=false;
        $scope.filter_preparing=false;
        $scope.filter_progress=false;
        $scope.filter_delivered=false;
        $scope.filter_cancelled=false;
        $scope.load_url = '/api/orders';
        $scope.next = null;
        $scope.previous = null;
        $scope.page_no = 1;
        $scope.page_size = 5;
        this.reloadOrder();
    };

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
