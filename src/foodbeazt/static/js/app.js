var fbeastApp = angular.module('fbeaztApp',['ngRoute', 'ngSanitize', 'ngCookies', 'checklist-model', 'fbFilters'])

fbeastApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
          when('/', {
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
        $rootScope.$broadcast('subscribeToAddToCart');
    };

    return eventBus;
});

fbeastApp.controller('mainCtrl', function($route, $scope, $http, $log, eventBus){
    items = $scope.items = []
    url = '/api/products/-1'

    search = $scope.search = function() {
        args = {}
        $http.get(url, args).success(function(data){
            if(data) {
                $scope.items = data
            }
        }).error(function(err){
            console.log(err)
        })
    }

    $scope.addToCart = function(id){
        var data = _.find(this.items, function(x) { return x._id.$oid == id; })
        eventBus.send(data)
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
    cart = { 'items': [], 'created_at': new Date(), 'total': 0.0 }

    try {
        cart = $cookieStore.get('__tmpCart') || { 'items': [], 'created_at': new Date(), 'total': 0.0 }
    }catch(e){

    }

    $scope.cart = cart

    calculateCartTotals = function(){
        if(this.cart.items.length == 0){
            this.cart.total = 0.0
            return
        }

        this.cart.total = parseFloat(_.chain(this.cart.items)
                            .map(function(x){
                                   return x.quantity*x.sell_price
                            })
                            .reduce(function(total, x){
                                return total+x
                            }).value())
    }

    $scope.removeItem = function(id){
        var item = _.remove(this.cart.items, function(x) { return x._id.$oid == id })
        return false
    }

    $scope.$on('subscribeToAddToCart', function(){
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
        return $location.path() != '/confirm_order'
    }
})

fbeastApp.controller('confirmOrderCtrl', function($location, $scope, $http, $routeParams, $log, $cookieStore, eventBus){
    cart = $scope.cart = $cookieStore.get('__tmpCart')

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
        $cookieStore.put('__tmpCart', this.cart)
        $cookieStore.put('__tmpCustomer', this.cart.customer)
    }
})