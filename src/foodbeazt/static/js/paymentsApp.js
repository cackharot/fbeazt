var paymentApp = angular.module('fbeaztAdmin')

paymentApp.controller('paymentsListCtrl', function ($scope, $http, $routeParams) {
  $scope.payments = []
  $scope.searchText = "";
  $scope.page_no = 1;
  $scope.page_size = 10;
  $scope.next = null;
  $scope.previous = null;
  $scope.load_url = '/api/payments';

  $scope.reload = function (url) {
    if (url === undefined || url === null) {
      $scope.page_no = 1;
      $scope.page_size = 10;
      $scope.next = null;
      $scope.previous = null;
    }
    var status = [];
    if ($scope.filter_success) status.push('success');
    if ($scope.filter_pending) status.push('pending');
    if ($scope.filter_failure) status.push('failure');
    var params = {
      'order_no': $scope.searchText,
      'status': status.join(','),
      'page_no': $scope.page_no,
      'page_size': $scope.page_size
    };
    $http.get(url || $scope.load_url, { params: params })
      .success(function (d) {
        $scope.payments = d.items;
        $scope.total = d.total;
        $scope.page_no = d.page_no;
        $scope.page_count = Math.ceil(d.total / $scope.page_size);
        $scope.next = d.next;
        $scope.previous = d.previous;
      }).error(function (e) {
        alert(e);
      });
  };

  $scope.navigate = function (url) {
    $scope.reload(url);
    return false;
  };

  $scope.resetSearch = function () {
    $scope.searchText = "";
    $scope.filter_success = false;
    $scope.filter_pending = false;
    $scope.filter_failure = false;
    $scope.load_url = '/api/payments';
    $scope.next = null;
    $scope.previous = null;
    $scope.page_no = 1;
    $scope.page_size = 10;
    $scope.reload();
  };

  $scope.reload();
})
