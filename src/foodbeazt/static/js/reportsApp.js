var reportsApp = angular.module('fbeaztAdmin');

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

reportsApp.controller('reportsCtrl', function ($scope, $http) {
  var setupOrderTrendChart = function () {
    $scope.labels = MONTHS;
    // $scope.colors = ['#803690', '#00ADF9', '#DCDCDC', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360'];
    $scope.series = ['Total', 'Delivered', 'Cancelled', 'Pending'];
    $scope.data = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };
    var fmtMonth = function (data, status_key) {
      var total = [];
      for (var i = 1; i <= 12; ++i) {
        if (data[status_key]) {
          total.push(data[status_key][i.toString()] || 0);
        } else {
          total.push(0);
        }
      }
      return total;
    };
    $http.get('/api/reports/orders?report_type=order_trend').success(function (d) {
      $scope.data[1] = fmtMonth(d, 'delivered');
      $scope.data[2] = fmtMonth(d, 'cancelled');
      $scope.data[3] = fmtMonth(d, 'pending');
      $scope.data[0] = $scope.data[1].map(function (num, idx) {
        return num + $scope.data[2][idx] + $scope.data[3][idx];
      });
    }).error(function (e) {
      alert(e);
    });
  };

  var setupRevenueChart = function () {
    $scope.revenueLabels = MONTHS;
    $scope.revenueSeries = ['Order Amount', 'Delivery Charges', 'Profit(7% of order + Delivery charges)'];
    $scope.revenueData = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    $http.get('/api/reports/orders?report_type=revenue_trend').success(function (d) {
      var total = [];
      var profit = [];
      var delivery_charges = [];
      for (var i = 1; i <= 12; ++i) {
        var m = d[i.toString()];
        if (!m) {
          total.push(0); profit.push(0); delivery_charges.push(0);
        } else {
          var tl = m['total'] || 0;
          var dc = m['delivery_charges'] || 0;
          var p = (tl*0.07) + dc;
          total.push(tl); profit.push(p); delivery_charges.push(dc);
        }
      }
      $scope.revenueData = [total, delivery_charges, profit];
    }).error(function (e) {
      alert(e);
    });
  };

  setupOrderTrendChart();
  setupRevenueChart();
});