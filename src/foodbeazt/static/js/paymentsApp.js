var paymentApp = angular.module('fbeaztAdmin')
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

paymentApp.controller('paymentsListCtrl', function ($scope, $http, $routeParams) {
  $scope.payments = []
  $scope.searchText = "";
  $scope.page_no = 1;
  $scope.page_size = 10;
  $scope.next = null;
  $scope.previous = null;
  $scope.load_url = '/api/payments';
  $scope.report_url = '/api/reports/payment';
  $scope.labels = MONTHS;
  $scope.series = ['Success', 'Failed', 'Service Charge 2.5%'];
  $scope.report_data = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  var today = new Date();
  $scope.years = [];
  for (var i = today.getFullYear(); i >= today.getFullYear() - 5; --i) {
    $scope.years.push(i);
  }
  $scope.selected_year = $scope.years[0];

  $scope.select_year = function (year) {
    $scope.selected_year = year;
    $scope.reload_report();
  }

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

  $scope.reload_report = function(){
    var fmtData = function (data, status_key) {
      var total = [];
      for (var i = 1; i <= 12; ++i) {
        var d = data[status_key];
        if (d && d[i] && d[i.toString()].total > 0) {
          total.push(d[i.toString()].total);
        } else {
          total.push(0);
        }
      }
      return total;
    };
    $http.get($scope.report_url, { params: {year: $scope.selected_year || 0} })
      .success(function (d) {
        $scope.report_data[0] = fmtData(d, 'success');
        $scope.report_data[1] = fmtData(d, 'failure');
        $scope.report_data[2] = fmtData(d, 'success').map(function(x){ return (-x * 0.025).toFixed(2)});
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
  $scope.reload_report();
})
