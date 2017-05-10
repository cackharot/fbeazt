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
    $http.get('/api/reports/orders?report_type=order_trend&year=' + $scope.selected_year).success(function (d) {
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
    $http.get('/api/reports/orders?report_type=revenue_trend&year=' + $scope.selected_year).success(function (d) {
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
          var p = ((tl * 0.07) + dc).toFixed(2);
          total.push(tl); profit.push(p); delivery_charges.push(dc);
        }
      }
      $scope.revenueData = [total, delivery_charges, profit];
    }).error(function (e) {
      alert(e);
    });
  };

  var loadOrders = function (store_id, year, month) {
    $scope.orders = [];
    var month_index = $scope.months.indexOf(month) + 1;
    $http.get('/api/reports/orders?report_type=load_orders&store_id=' + store_id + '&year=' + year + '&month=' + month_index).success(function (d) {
      $scope.orders = d.orders;
      $scope.orders_totals = d.totals;
    }).error(function (e) {
      alert(e);
    });
  };

  $scope.reloadStore = function () {
    $http.get('/api/stores', { params: { 'page_size': 200 } }).success(function (d) {
      $scope.stores = d.items;
      if (!$scope.stores || $scope.stores.length == 0) {
        $scope.stores = [];
      }
      $scope.stores.splice(0, 0, { '_id': { "$oid": '-1' }, 'name': 'All Stores' });
      $scope.setStore($scope.stores[0]._id.$oid);
    }).error(function (e) {
      alert(e)
    })
  }

  $scope.months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  var today = new Date();
  $scope.years = [];
  for (var i = today.getFullYear(); i >= today.getFullYear() - 5; --i) {
    $scope.years.push(i);
  }
  $scope.selected_year = $scope.years[0];
  $scope.selected_month = $scope.months[today.getMonth()];

  $scope.setStore = function (store_id) {
    $scope.selected_store = store_id;

    for (var i = 0; i < $scope.stores.length; ++i) {
      var s = $scope.stores[i];
      if (s._id.$oid == store_id) {
        $scope.selected_store_name = s.name;
      }
    }

    loadOrders($scope.selected_store, $scope.selected_year, $scope.selected_month);
    return false;
  };

  $scope.select_month = function (month) {
    $scope.selected_month = month;
    loadOrders($scope.selected_store, $scope.selected_year, $scope.selected_month);
  }
  $scope.select_year = function (year) {
    $scope.selected_year = year;
    loadOrders($scope.selected_store, $scope.selected_year, $scope.selected_month);
    setupOrderTrendChart();
    setupRevenueChart();
  }

  $scope.reloadStore();
  setupOrderTrendChart();
  setupRevenueChart();

  $scope.tableToExcel = (function () {
    var uri = 'data:application/vnd.ms-excel;base64,'
      , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
      , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
      , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };

    return function (table, name) {
      if (!table.nodeType) table = document.getElementById(table);
      var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML };
      window.location.href = uri + base64(format(template, ctx));
    }
  })();
});
