var orderApp = angular.module('fbeaztAdmin');

orderApp.controller('orderListCtrl', function ($scope, $http, $routeParams) {
    $scope.stores = [];
    $scope.orders = [];
    $scope.searchText = "";
    $scope.filter_pending = false;
    $scope.filter_preparing = false;
    $scope.filter_progress = false;
    $scope.filter_delivered = false;
    $scope.filter_cancelled = false;
    $scope.selected_store = null;
    $scope.selected_store_name = 'Select Store';
    $scope.page_no = 1;
    $scope.page_size = 10;
    $scope.next = null;
    $scope.previous = null;
    $scope.load_url = '/api/orders';
    $scope.report = { total: 0, pending: 0, preparing: 0, cancelled: 0, delivered: 0 };
    $scope.notes_order = null;
    $scope.show_notes = false;
    $scope.notesText = '';

    $scope.reloadOrder = function (url) {
        if (!$scope.selected_store) return;
        if (url === undefined || url === null) {
            $scope.page_no = 1;
            $scope.page_size = 10;
            $scope.next = null;
            $scope.previous = null;
        }
        var order_status = [];
        if ($scope.filter_pending) order_status.push('PENDING');
        if ($scope.filter_preparing) order_status.push('PREPARING');
        if ($scope.filter_progress) order_status.push('PROGRESS');
        if ($scope.filter_delivered) order_status.push('DELIVERED');
        if ($scope.filter_cancelled) order_status.push('CANCELLED');
        var params = {
            'store_id': $scope.selected_store,
            'filter_text': $scope.searchText,
            'order_status': order_status.join(','),
            'page_no': $scope.page_no,
            'page_size': $scope.page_size
        };
        $http.get(url || $scope.load_url, { params: params })
            .success(function (d) {
                $scope.orders = d.items;
                $scope.total = d.total;
                $scope.page_no = d.page_no;
                $scope.page_count = Math.ceil(d.total / $scope.page_size);
                $scope.next = d.next;
                $scope.previous = d.previous;
            }).error(function (e) {
                alert(e.message || e);
            });
    };

    $scope.getOrderStores = function (order) {
        var store_names = [];
        for (i = 0; i < order.items.length; ++i) {
            var n = order.items[i].store.name;
            if(store_names.indexOf(n) == -1){
                store_names.push(n);
            }
        }
        return store_names;
    };

    $scope.getOrderItems = function (order, store_name) {
        var result = [];
        for (i = 0; i < order.items.length; ++i) {
            if (store_name === order.items[i].store.name) {
                result.push(order.items[i]);
            }
        }
        return result;
    };

    $scope.navigate = function (url) {
        $scope.reloadOrder(url);
        return false;
    };

    $scope.updateStatus = function (item, status) {
        if (item.status == 'DELIVERED') {
            alert("You cannot change already delivered order!");
            return false;
        }
        if (status == 'DELIVERED') {
            if (!confirm("Are you sure the order is delivered successfully?")) {
                return false;
            }
        }
        var notes = '';
        if(status == 'CANCELLED'){
            if($scope.notes_order == null){
                $scope.notes_order = item;
                $scope.notesText = '';
                $scope.show_notes = true;
            }else{
                notes = ($scope.notesText || '').trim();
                if(notes == ''){
                    alert('Notes required!');
                    return false;
                }
                $scope.notes_order = null;
                $scope.show_notes = false;
            }
        }
        $http.post('/api/order_status/' + item._id.$oid, { 'status': status, 'notes': notes })
            .success(function (d) {
                item.status = status;
            }).error(function (e) {
                alert(e.message);
            });
        return true;
    };

    $scope.cancelNotesModal = function(){
        $scope.show_notes = false;
        $scope.notes_order = null;
        $scope.notesText = '';
        return true;
    };

    $scope.reloadStore = function () {
        $http.get('/api/stores', { params: { 'page_size': 200 } }).success(function (d) {
            $scope.stores = d.items;
            if ($routeParams.store_id)
                $scope.setStore($routeParams.store_id);
            else if ($scope.stores && $scope.stores.length > 0)
                $scope.setStore($scope.stores[0]._id.$oid);
            if (!$scope.stores || $scope.stores.length == 0) {
                $scope.stores = [];
                $scope.stores.push({ '_id': { "$oid": '' }, 'name': 'No stores available!' });
            }

        }).error(function (e) {
            alert(e);
        });
    };

    $scope.reloadStore();

    $scope.resetSearch = function () {
        $scope.searchText = "";
        $scope.filter_pending = false;
        $scope.filter_preparing = false;
        $scope.filter_progress = false;
        $scope.filter_delivered = false;
        $scope.filter_cancelled = false;
        $scope.load_url = '/api/orders';
        $scope.next = null;
        $scope.previous = null;
        $scope.page_no = 1;
        $scope.page_size = 10;
        this.reloadOrder();
    };

    $scope.setStore = function (store_id) {
        if (!store_id || store_id == '-1' || store_id == '') return
        $scope.selected_store = store_id;

        for (var i = 0; i < $scope.stores.length; ++i) {
            var s = $scope.stores[i];
            if (s._id.$oid == store_id) {
                $scope.selected_store_name = s.name;
            }
        }

        $scope.reloadOrder();
    };

    $scope.fetchReports = function () {
        $http.get('/api/reports/orders')
            .success(function (d) {
                $scope.report = d;
            })
            .error(function (e) {
                alert(e);
            });
    };

    $scope.fetchReports();

    $scope.subTotal = function(order) {
        var st = 0;
        for(var i=0; i < order.items.length; ++i){
            var item = order.items[i];
            st = st + item.total;
        }
        return st;
    };

    $scope.getStoreStatus = function(order, store_name) {
        let store_status = $scope.getStoreDeliveryStatus(order, store_name);
        const displayNames = {
            'PROGRESS': 'READY',
            'DELIVERED': 'PICKED UP'
        };
        let st = store_status ? store_status.status : 'NA';
        let displayName = displayNames[st];
        return displayName ? displayName : st;
    };

    $scope.getStoreOrderNo = function(order, store_name) {
        let store_status = $scope.getStoreDeliveryStatus(order, store_name);
        return store_status ? store_status.no : 'NA';
    };

    $scope.getStoreDeliveryStatus = function(order, store_name) {
        if(!order.store_delivery_status){
            return null;
        }
        const store = findStore(store_name, order);
        const store_id = store._id.$oid;
        const store_status = order.store_delivery_status[store_id];
        return store_status;
    };

    let findStore = function(store_name, order){
        for(var i =0; i< order.items.length; ++i) {
            const store = order.items[i].store;
            if(store.name === store_name){
                return store;
            }
        }
        return null;
    };

    $scope.updateStoreOrderStatus = function (order, store_name, status) {
        if(['DELIVERED', 'PAID', 'CANCELLED'].indexOf(status) === -1){
            alert('Invalid status');
            return false;
        }
        const store = findStore(store_name, order);
        const store_id = store._id.$oid;
        $http.post('/api/store_order_status', {store_id, order_id: order._id.$oid, status, notes: '' })
            .success(function (d) {
                order.store_delivery_status[store_id].status = status;
            })
            .error(function (e) {
                alert(e);
            });
        return true;
    };
});
