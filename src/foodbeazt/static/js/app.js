var fbeastApp = angular.module('fbeaztApp',['ngRoute', 'ngSanitize', 'ngCookies', 'checklist-model', 'fbFilters'])

fbeastApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
          when('/', {
            templateUrl: '/static/templates/product_list.html',
            controller: 'mainCtrl'
          }).
          when('/detail/:id', {
            templateUrl: '/static/templates/product_detail.html',
            controller: 'detailCtrl'
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
    url = '/api/product/'

    retrieve = $scope.retrieve = function(id) {
        $http.get(url + id).success(function(data){
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

fbeastApp.controller('cartCtrl', function($route, $scope, $http, $routeParams, $log, eventBus){
    cart = $scope.cart = {}
    cart.items = []
    cart.created_at = new Date()
    cart.total = 0

    calculateCartTotals = function(){
        this.cart.total = _.chain(this.cart.items)
                            .map(function(x){
                                   return x.quantity*x.sell_price
                            })
                            .reduce(function(total, x){
                                return total+x
                            }).value()
    }

    $scope.$on('subscribeToAddToCart', function(){
        var item = eventBus.data

        var data = _.find(this.cart.items, function(x) { return x._id.$oid == item._id.$oid })

        if(data){
            data.quantity++
        }else{
            item.quantity = 1
            this.cart.items.push(item)
        }

        this.calculateCartTotals()
    })
})
