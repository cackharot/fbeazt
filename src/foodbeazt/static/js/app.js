var fbeastApp = angular.module('fbeaztApp',['ngRoute', 'ngSanitize', 'ngCookies', 'ngStorage', 'checklist-model', 'fbFilters', 'ngAnimate'])
                       .run(function($rootScope, $location) {
                            $rootScope.location = $location;
                       })

var MINIMUM_FREE_DELIVERY_ORDER_AMOUNT = 10000.0
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
          when('/delivery_details', {
            templateUrl: '/static/templates/delivery_details.html',
            controller: 'confirmOrderCtrl'
          }).
           when('/review', {
            templateUrl: '/static/templates/review.html',
            controller: 'reviewCtrl'
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

    eventBus.updateCart = function(){
        $rootScope.$broadcast('updateCart');
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
        eventBus.send($scope.item)
    }

    retrieve()
})

fbeastApp.controller('cartCtrl', function($route, $location, $scope, $http, $routeParams, $log, $localStorage, eventBus){
    cart = DEFAULT_CART

    try {
        cart = $localStorage.tmpCart || DEFAULT_CART
    }catch(e){

    }

    $scope.cart = cart
    $scope.min_order_amount = MINIMUM_FREE_DELIVERY_ORDER_AMOUNT

    calculateDeliveryCharges = function(total){
        return total < MINIMUM_FREE_DELIVERY_ORDER_AMOUNT ? DEFAULT_DELIVERY_CHARGES : 0.0
    }

    calculateCartTotals = function(){
        if(cart.items.length == 0){
            cart.delivery_charges = 0.0
            cart.total = 0.0
            return
        }

        var tmpTotal = parseFloat(_.chain(cart.items)
                            .map(function(x){
                                   return x.quantity*x.sell_price
                            })
                            .reduce(function(total, x){
                                return total+x
                            }).value())

        cart.delivery_charges = calculateDeliveryCharges(tmpTotal)
        cart.total = tmpTotal + cart.delivery_charges
    }

    $scope.removeItem = function(id){
        var item = _.remove(cart.items, function(x) { return x._id.$oid == id })
        return false
    }

    $scope.$watchCollection('cart.items', function(newValue, oldValue) {
        calculateCartTotals()
        $localStorage.tmpCart = $scope.cart
    });

    $scope.continueOrder = function(){
        $location.path('/delivery_details')
    }

    $scope.canShowContinueBtn = function(){
        var curr_path = $location.path()
        return (curr_path != '/delivery_details' 
                && curr_path != '/order_success'
                && curr_path != '/review'
                && curr_path != '/processing') 
                && cart.total > 0
    }

    $scope.canShowCartHeader = function(){
        var curr_path = $location.path()
        return (curr_path != '/review' && curr_path != '/order_success' && curr_path != '/processing')
    }

    $scope.resetOrder = function(){
        cart = DEFAULT_CART
        cart.items = []
        $scope.cart = cart
        calculateCartTotals()
        $localStorage.$reset()
    }

    $scope.$on('updateCart', function(){
        cart = $localStorage.tmpCart
        $scope.cart = cart
        calculateCartTotals()
    })

    $scope.$on('itemAddedToCart', function(){
        var item = eventBus.data

        var data = _.find($scope.cart.items, function(x) { return x._id.$oid == item._id.$oid })

        if(data){
            data.quantity++
            calculateCartTotals()
            $localStorage.tmpCart = $scope.cart
        }else{
            item.quantity = 1
            $scope.cart.items.push(item)
        }
    })

    $scope.$on('resetOrder', $scope.resetOrder);
})

fbeastApp.controller('confirmOrderCtrl', function($location, $scope, $http, $routeParams, $log, $localStorage, eventBus){
    $scope.location = $location
    $scope.cart = $localStorage.tmpCart

    if(!$scope.cart || $scope.cart.items.length == 0) {
        $location.path('/')
        return;
    }

    if(!$scope.cart.customer || !$scope.cart.customer.name){
        $scope.cart.customer = $localStorage.tmpCustomer || {}
    }

    $scope.continueContactDetails = function() {
        // validate customer data
        // submit the cart to service to generate order tracking id
        // and show success message
        $localStorage.tmpCart = $scope.cart
        $localStorage.tmpCustomer = $scope.cart.customer
        $location.path('/review')
    }
})

fbeastApp.controller('reviewCtrl', function($location, $scope, $localStorage, $http, eventBus){
    $scope.cart = $localStorage.tmpCart

    $scope.removeItem = function(id){
        var item = _.remove($scope.cart.items, function(x) { return x._id.$oid == id })
        return false
    }

    $scope.calculateDeliveryCharges = function(total){
        return total < MINIMUM_FREE_DELIVERY_ORDER_AMOUNT ? DEFAULT_DELIVERY_CHARGES : 0.0
    }

    $scope.calculateCartTotals = function(){
        if($scope.cart.items.length == 0){
            $scope.cart.delivery_charges = 0.0
            $scope.cart.total = 0.0
            return
        }

        var tmpTotal = parseFloat(_.chain($scope.cart.items)
                            .map(function(x){
                                   return x.quantity*x.sell_price
                            })
                            .reduce(function(total, x){
                                return total+x
                            }).value())

        $scope.cart.delivery_charges = $scope.calculateDeliveryCharges(tmpTotal)
        $scope.cart.total = tmpTotal + $scope.cart.delivery_charges
    }

    $scope.$watchCollection('cart.items', function(newValue, oldValue) {
        $scope.calculateCartTotals()
        $localStorage.tmpCart = $scope.cart
        eventBus.updateCart();
    });

    $scope.confirmOrder = function() {
        $localStorage.tmpCart = $scope.cart
        $location.path('/processing')
    }
})

fbeastApp.controller('orderProcessingCtrl', function($location, $scope, $localStorage, $http){
    cart = $scope.cart = $localStorage.tmpCart
    var url = '/api/order/-1'

    if(!cart || !cart.customer || cart.customer.name == '' || cart.customer.email == ''
    || cart.customer.mobile == '' || cart.customer.street  == ''){
        alert('Enter your delivery details')
        $location.path('/delivery_details')
        return
    }

    if(cart.order_no && cart.order_no.length > 0){
        $location.path('/order_success')
        return
    }

    $http.post(url, $scope.cart).success(function(data){
        if(data && data.data)
            cart.order_no = data.data.order_no
        $localStorage.tmpCart = $scope.cart
        $location.path('/order_success')
    }).error(function(e){
        console.log(e)
        $location.path('/delivery_details')
    })
})

fbeastApp.controller('orderSuccessCtrl', function($location, $scope, eventBus, $localStorage){
    $scope.confirmed_cart = $localStorage.tmpCart
    if(!$scope.confirmed_cart || !$scope.confirmed_cart.items || $scope.confirmed_cart.items.length == 0){
        $location.path("/")
        return
    }
    eventBus.resetOrder()
})