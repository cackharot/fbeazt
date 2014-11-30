var fbeastApp = angular.module('fbeaztApp',['ngRoute', 'ngSanitize', 'ngCookies', 'checklist-model', 'fbFilters'])

var MINIMUM_FREE_DELIVERY_ORDER_AMOUNT = 500.0
var DEFAULT_DELIVERY_CHARGES = 30.0
var DEFAULT_CART = { 'items': [], 'created_at': new Date(), 'total': 0.0, 'delivery_charges': DEFAULT_DELIVERY_CHARGES }

fbeastApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
          when('/', {
            templateUrl: '/static/templates/product_list.html',
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
            controller: 'confirmOrderCtrl'
          }).
          otherwise({
            redirectTo: '/'
          });
}])

fbeastApp.factory('eventBus', function($rootScope) {
    var eventBus = {};

    eventBus.data = {};

    eventBus.send = function(data) {
        this.data = data;
        this.broadcastItem();
    };

    eventBus.broadcastItem = function() {
        $rootScope.$broadcast('itemAddedToCart');
    };

    return eventBus;
});

fbeastApp.controller('mainCtrl', function($route, $scope, $http, $log, eventBus, $routeParams){
    total = $scope.total = 0
    page_no = $scope.page_no = 1
    page_size = $scope.page_size = 12
    filter_text = $scope.filter_text = ''
    category = $routeParams.category || ''

    items = $scope.items = []
    url = '/api/products/-1'

    var getData = function(args, cb){
        $http.get(url, {params: args}).success(function(data){
            cb(data)
        }).error(function(err){
            console.log(err)
        })
    }

    getArgs = function(){
        return { 'page_no': this.page_no, 'page_size': this.page_size,
            'filter_text': this.filter_text, 'category': this.category }
    }

    search = $scope.search = function(reset_page_data) {
        if(reset_page_data){
            this.page_no = 1
        }
        var args = this.getArgs()
        getData(args, function(data){
            $scope.total = data.total
            $scope.items = data.items
        })
    }

    $scope.addToCart = function(id){
        var data = _.find(this.items, function(x) { return x._id.$oid == id; })
        eventBus.send(data)
    }

    $scope.loadMore = function(){
        $scope.page_no = $scope.page_no + 1
        var args = this.getArgs()
        getData(args, function(data){
            $scope.total = data.total
            $scope.items = $scope.items.concat(data.items)
        })
    }

    search()
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
        console.log(this.cart)
        this.cart = DEFAULT_CART
        $cookieStore.remove('__tmpCart')
    }
})

fbeastApp.controller('confirmOrderCtrl', function($location, $scope, $http, $routeParams, $log, $cookieStore, eventBus){
    $scope.location = $location
    cart = $scope.cart = $cookieStore.get('__tmpCart') || {}

    if(!cart || cart.items.length == 0) {
        $location.path('/')
    }

    if(!cart.customer || !cart.customer.name){
        cart.customer = $cookieStore.get('__tmpCustomer') || {}
    }

    $scope.confirmOrder = function() {
        // validate customer data
        // submit the cart to service to generate order tracking id
        // and show success message
        $location.path('/processing')

        var url = '/api/order/-1'
        $http.post(url, this.cart).success(function(data){
            if(data && data.data)
                this.cart.order_no = data.data.order_no
            $cookieStore.put('__tmpCart', this.cart)
            $location.path('/order_success')
        }).error(function(e){
            alert(e)
            $location.path('/confirm_order')
        })
    }
})

fbeastApp.controller('orderSuccessCtrl', function($location, $scope, $cookieStore){
    $scope.cart = $cookieStore.get('__tmpCart')
    $cookieStore.put('__tmpCart', null)
    $cookieStore.remove('__tmpCart')
})