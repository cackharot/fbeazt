var couponApp = angular.module('fbeaztAdmin');

couponApp.controller('couponListCtrl', function ($route, $scope, $http, $routeParams, $window) {
    $scope.coupons = [];

    $scope.reloadCoupons = function () {
        $http.get('http://localhost:5000/api/coupon').success(function (d) {
            $scope.coupons = d;
        }).error(function (e) {
            console.error(e);
            alert(e);
        });
    };

    $scope.reloadCoupons();
})

couponApp.controller('couponDetailCtrl', function ($scope, $http, $routeParams, $location) {
    $scope.model = {};

    $http.get('http://localhost:5000/api/coupon/' + $routeParams.id).success(function (d) {
        if (!d){ d = {"status": true}}
        if (!d.id) {d.id = "-1";d.status=true;}
        if(d.start){
            d.start = new Date(d.start);
        }
        if(d.end){
            d.end = new Date(d.end);
        }
        $scope.model = d;
        console.log(d);
    }).error(function (e) {
        console.error(e);
        alert('Error while fetching coupon details');
        $location.path('/coupon');
    })

    $scope.save = function () {
        if ($scope.frmCoupon.$invalid) {
            alert("Form contains invalid data\n\nPlease check the form and submit again");
            return;
        }

        var item = angular.copy($scope.model);

        if (item.id == "-1") {
            item.id = null;
            res = $http.post('http://localhost:5000/api/coupon', item);
        } else {
            res = $http.put('http://localhost:5000/api/coupon/' + item.id, item);
        }

        res.success(function (data) {
            if (data.status == "success") {
                $location.path('/coupon');
            } else {
                alert(data.message);
            }
        }).error(function (e) {
            alert(e);
            console.error(e);
        })
    }
});