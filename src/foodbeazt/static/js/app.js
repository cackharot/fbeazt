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
					when('/restaurant/:id', {
            templateUrl: '/static/templates/product_list.html',
            controller: 'searchResultCtrl'
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
          when('/about', {
            templateUrl: '/static/templates/about.html'
          }).
          when('/terms', {
            templateUrl: '/static/templates/terms.html'
          }).
          when('/faq', {
            templateUrl: '/static/templates/faq.html'
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
		
    eventBus.storeSearchEvent = function(data) {
        this.search_data = data;
        $rootScope.$broadcast('storeSearch');
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
	$scope.city = "puducherry"
	$scope.address = ''
	$scope.category = ''

	$scope.search = function() {
		$scope.submitted = true
		if($scope.addressForm.$valid === false || $scope.address.length == 0){
			return
		}
		
		try{
			pincode = parseInt($scope.address)
			if($scope.address.length != 6){
				addressForm.address.$error.pincode = true
				return
			}
		}catch(ignored){}
		
		$scope.city = "puducherry"
		eventBus.storeSearchEvent({
				'category': $scope.category,
				'address': $scope.address,
				'city': $scope.city
		})
	}
})

fbeastApp.controller('storeSearchResultCtrl', function($route,$scope,$http,eventBus){
	$scope.items = []
	var url = '/api/stores'
	
	var search = function(){
		$scope.submitted = true
		var options = $.extend({}, eventBus.search_data);
		
		$http.get(url, {params:options}).success(function(data){
			$scope.items = data
		}).error(function(err){
			console.log(err)
		})
	};
	
	$scope.$on('storeSearch', search);	
})

fbeastApp.controller('searchResultCtrl', function($route, $scope, $http, $routeParams, eventBus){
	$scope.total = 0
	$scope.page_no = 1
	$scope.page_size = 12

	$scope.store = null
	$scope.items = []
	var store_id = $routeParams.id || '-1'
	var url = '/api/products/' + store_id
	
	$http.get('/api/store/'+store_id).success(function(store_data){
		$scope.store = store_data
	}).error(function(err){
		console.log(err)
	})

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
	if(store_id != '-1'){	
		search()
	}
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
        cart.order_no = ''
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
        $localStorage.tmpCart = $scope.cart
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
        $localStorage.tmpCart = $scope.cart
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
    $scope.cart = $localStorage.tmpCart
    var url = '/api/order/-1'

    if(!$scope.cart || !$scope.cart.customer || $scope.cart.customer.name == '' || $scope.cart.customer.email == ''
    || $scope.cart.customer.mobile == '' || $scope.cart.customer.street  == ''){
        alert('Enter your delivery details')
        $location.path('/delivery_details')
        return
    }

    if($scope.cart.order_no && $scope.cart.order_no.length > 0){
        $location.path('/order_success')
        return
    }

    $http.post(url, $scope.cart).success(function(data){
        if(data && data.data)
            $scope.cart.order_no = data.data.order_no
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