var fbeastApp = angular.module('fbeaztApp',['ngRoute', 'ngSanitize', 'ngCookies', 'checklist-model', 'fbFilters'])

var MINIMUM_FREE_DELIVERY_ORDER_AMOUNT = 500.0
var DEFAULT_DELIVERY_CHARGES = 30.0
var DEFAULT_CART = { 'items': [], 'created_at': new Date(), 'total': 0.0, 'delivery_charges': DEFAULT_DELIVERY_CHARGES }

fbeastApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
          when('/', {
            templateUrl: '/static/templates/search_form.html',
            controller: 'mainCtrl'
          }).
          when('/search/:category', {
            templateUrl: '/static/templates/product_list.html',
            controller: 'mainCtrl'
          }).
          when('/detail/:store_id/:id', {
            templateUrl: '/static/templates/product_detail.html',
            controller: 'detailCtrl'
          }).
          when('/confirm_order', {
            templateUrl: '/static/templates/confirm_order.html',
            controller: 'confirmOrderCtrl'
          }).
          when('/order_success', {
            templateUrl: '/static/templates/order_success.html',
            controller: 'orderSuccessCtrl'
          }).
          when('/processing', {
            templateUrl: '/static/templates/processing.html',
            controller: 'orderProcessingCtrl'
          }).
          otherwise({
            redirectTo: '/'
          });
}])

fbeastApp.factory('eventBus', function($rootScope) {
    var eventBus = {};

    eventBus.data = {};
    eventBus.search_data = {};

    eventBus.send = function(data) {
        this.data = data;
        $rootScope.$broadcast('itemAddedToCart');
    };

    eventBus.searchEvent = function(data) {
        this.search_data = data;
        $rootScope.$broadcast('itemSearch');
    };

    eventBus.resetOrder = function(){
        $rootScope.$broadcast('resetOrder');
    }

    return eventBus;
});

fbeastApp.controller('mainCtrl', function($route, $scope, $http, $log, eventBus, $routeParams){
    $scope.filter_text = $routeParams.filter_text || ''

    $scope.search = function(reset_page_data) {
        eventBus.searchEvent({
            'reset_page_data': reset_page_data,
            'filter_text': $scope.filter_text,
            'category': ''
        })
    }

    $scope.search()
})

fbeastApp.controller('searchResultCtrl', function($route, $scope, $http, eventBus){
    $scope.total = 0
    $scope.page_no = 1
    $scope.page_size = 12

    $scope.items = []
    url = '/api/products/-1'

    var getData = function(args, cb){
        $http.get(url, {params: args}).success(function(data){
            cb(data)
        }).error(function(err){
            console.log(err)
        })
    }

    getArgs = function(filter_text, category){
        return { 'page_no': $scope.page_no, 'page_size': $scope.page_size,
            'filter_text': filter_text, 'category': category }
    }

    $scope.addToCart = function(id){
        var data = _.find(this.items, function(x) { return x._id.$oid == id; })
        eventBus.send(data)
    }

    $scope.loadMore = function(){
        $scope.page_no = $scope.page_no + 1
        var args = getArgs()
        getData(args, function(data){
            $scope.total = data.total
            $scope.items = $scope.items.concat(data.items)
        })
    }

    var search = function(){
         var options = $.extend({
                               'reset_page_data': true,
                               'filter_text': '',
                               'category': ''
                            },
                            eventBus.search_data);

         if(options.reset_page_data){
             $scope.page_no = 1
         }
         var args = getArgs(options.filter_text, options.category)
         getData(args, function(searchResultData){
             $scope.total = searchResultData.total
             $scope.items = searchResultData.items
         })
     };

    $scope.$on('itemSearch', search)
    search();
})

fbeastApp.controller('detailCtrl', function($route, $scope, $http, $routeParams, eventBus){
    $scope.item = {}
    url = '/api/product/'+ $routeParams.store_id + "/" + $routeParams.id

    retrieve = $scope.retrieve = function() {
        $http.get(url).success(function(data){
            if(data) {
                $scope.item = data
            }
        }).error(function(err){
            console.log(err)
        })
    }

    $scope.addToCart = function(id){
        eventBus.send({'_id': id})
    }

    retrieve()
})

fbeastApp.controller('cartCtrl', function($route, $location, $scope, $http, $routeParams, $log, $cookieStore, eventBus){
    cart = DEFAULT_CART

    try {
        cart = $cookieStore.get('__tmpCart') || DEFAULT_CART
    }catch(e){

    }

    $scope.cart = cart
    $scope.min_order_amount = MINIMUM_FREE_DELIVERY_ORDER_AMOUNT

    calculateDeliveryCharges = function(total){
        return total < MINIMUM_FREE_DELIVERY_ORDER_AMOUNT ? DEFAULT_DELIVERY_CHARGES : 0.0
    }

    calculateCartTotals = function(){
        if(this.cart.items.length == 0){
            this.cart.total = 0.0
            return
        }

        var tmpTotal = parseFloat(_.chain(this.cart.items)
                            .map(function(x){
                                   return x.quantity*x.sell_price
                            })
                            .reduce(function(total, x){
                                return total+x
                            }).value())

        this.cart.delivery_charges = calculateDeliveryCharges(tmpTotal)
        this.cart.total = tmpTotal + this.cart.delivery_charges
    }

    $scope.removeItem = function(id){
        var item = _.remove(this.cart.items, function(x) { return x._id.$oid == id })
        return false
    }

    $scope.$watchCollection('cart.items', function(newValue, oldValue) {
        this.calculateCartTotals()
        $cookieStore.put('__tmpCart', this.cart)
    });

    $scope.continueOrder = function(){
        $location.path('/confirm_order')
    }

    $scope.canShowContinueBtn = function(){
        return ($location.path() != '/confirm_order' && $location.path() != '/order_success') && this.cart.total > 0
    }

    $scope.resetOrder = function(){
        this.cart = DEFAULT_CART
        this.cart.items = []
        $cookieStore.remove('__tmpCart')
        console.log(this.cart)
    }

    $scope.$on('itemAddedToCart', function(){
        var item = eventBus.data

        var data = _.find(this.cart.items, function(x) { return x._id.$oid == item._id.$oid })

        if(data){
            data.quantity++
            this.calculateCartTotals()
            $cookieStore.put('__tmpCart', this.cart)
        }else{
            item.quantity = 1
            this.cart.items.push(item)
        }
    })

    $scope.$on('resetOrder', $scope.resetOrder);
})

fbeastApp.controller('confirmOrderCtrl', function($location, $scope, $http, $routeParams, $log, $cookieStore, eventBus){
    $scope.location = $location
    $scope.cart = $cookieStore.get('__tmpCart') || {}

    if(!$scope.cart || $scope.cart.items.length == 0) {
        $location.path('/')
        return;
    }

    if(!$scope.cart.customer || !$scope.cart.customer.name){
        $scope.cart.customer = $cookieStore.get('__tmpCustomer') || {}
    }

    $scope.confirmOrder = function() {
        // validate customer data
        // submit the cart to service to generate order tracking id
        // and show success message
        $cookieStore.put('__tmpCart', $scope.cart)
        $cookieStore.put('__tmpCustomer', $scope.cart.customer)
        $location.path('/processing')
    }
})

fbeastApp.controller('orderProcessingCtrl', function($location, $scope, $cookieStore, $http){
    $scope.cart = $cookieStore.get('__tmpCart')
    var url = '/api/order/-1'
    $http.post(url, $scope.cart).success(function(data){
        if(data && data.data)
            this.cart.order_no = data.data.order_no
        $cookieStore.put('__tmpCart', $scope.cart)
        $location.path('/order_success')
    }).error(function(e){
        alert(e)
        $location.path('/confirm_order')
    })
})

fbeastApp.controller('orderSuccessCtrl', function($location, $scope, eventBus, $cookieStore){
    eventBus.resetOrder();
})