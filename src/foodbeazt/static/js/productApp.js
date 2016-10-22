var productApp = angular.module('fbeaztAdmin')

productApp.controller('productListCtrl', function ($scope, $http, $routeParams) {
  $scope.stores = []
  $scope.products = []
  $scope.selected_store = null
  $scope.selected_store_name = 'Select Store'

  $scope.reloadProduct = function () {
    if (!$scope.selected_store) return
    $http.get('/api/products/' + $scope.selected_store,
      { params: { "page_size": 200 } })
      .success(function (d) {
        $scope.products = d.items
        $scope.total = d.total
      }).error(function (e) {
        alert(e)
      })
  }

  $scope.reloadStore = function () {
    $http.get('/api/stores', { params: { 'page_size': 200 } }).success(function (d) {
      $scope.stores = d.items
      if ($routeParams.store_id)
        $scope.setStore($routeParams.store_id)
      else if ($scope.stores && $scope.stores.length > 0)
        $scope.setStore($scope.stores[0]._id.$oid)
      if (!$scope.stores || $scope.stores.length == 0) {
        $scope.stores = []
        $scope.stores.push({ '_id': { "$oid": '' }, 'name': 'No stores available!' })
      }

      $scope.reloadProduct()
    }).error(function (e) {
      alert(e)
    })
  }

  $scope.reloadStore()

  $scope.setStore = function (store_id) {
    if (!store_id || store_id == '-1' || store_id == '') return
    $scope.selected_store = store_id

    for (var i = 0; i < $scope.stores.length; ++i) {
      var s = $scope.stores[i]
      if (s._id.$oid == store_id) {
        $scope.selected_store_name = s.name
      }
    }

    $scope.reloadProduct()
    return false
  }

  $scope.deactivateProduct = function (id) {
    if (id && id != "-1") {
      $http.delete('/api/product/' + $scope.selected_store + '/' + id).success(function (d) {
        $scope.reloadProduct()
      }).error(function (e) {
        alert(e)
        $scope.reloadProduct()
      })
    }
    return false
  }

  $scope.activateProduct = function (id) {
    if (id && id != "-1") {
      $http.put('/api/product/activate/' + $scope.selected_store + '/' + id).success(function (d) {
        $scope.reloadProduct()
      }).error(function (e) {
        alert(e)
        $scope.reloadProduct()
      })
    }
    return false
  }
})

productApp.controller('productDetailCtrl', function ($scope, $routeParams, $location, $http, FileUploader) {
  var uploader = $scope.uploader = new FileUploader();
  var id = $routeParams.id || -1;
  var store_id = $routeParams.store_id || -1;
  var returnUrl = '/product?store_id=' + store_id;
  $scope.store_id = store_id;

  uploader.filters.push({
    name: 'imageFilter',
    fn: function (item /*{File|FileLikeObject}*/, options) {
      var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
      return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
    }
  });

  uploader.onSuccessItem = function () {
    $location.url(returnUrl);
  };
  uploader.onErrorItem = function (fileItem, response, status, headers) {
    console.info('onErrorItem', fileItem, response, status, headers);
  };

  $scope.model = {};
  $scope.food_types = [{ 'id': 'veg', 'text': 'Vegetarian' },
    { 'id': 'non-veg', 'text': 'Non-Vegetarian' }];

  $http.get('/api/product/' + $scope.store_id + '/' + id).success(function (d) {
    if (!d._id || !d._id.$oid)
      d._id = { "$oid": "-1" };
    $scope.model = d;
    if (!$scope.model.price_table) {
      $scope.model.price_table = [];
    }
  }).error(function (e) {
    alert('Error while fetching product details')
    $location.url(returnUrl);
  });

  $scope.removePriceTable = function (item) {
    var f = _.findIndex($scope.model.price_table, function (x) {
      return x.no === item.no;
    });
    if (f > -1) {
      $scope.model.price_table.splice(f, 1);
    }
    return false;
  };

  $scope.addPriceTable = function (item) {
    $scope.model.price_table.push({
      no: $scope.model.price_table.length + 1,
      description: '',
      price: 0.0
    })
    return false;
  };

  $scope.save = function () {
    if ($scope.frmProduct.$invalid) {
      alert("Form contains invalid data\n\nPlease check the form and submit again");
      return;
    }

    var item = angular.copy($scope.model);

    if (item._id.$oid == "-1") {
      item._id = null;
      res = $http.post('/api/product/' + $scope.store_id + '/-1', item);
    } else {
      res = $http.put('/api/product/' + $scope.store_id + '/' + item._id.$oid, item);
    }

    res.success(function (data) {
      if (data.status == "success") {
        var product_id = data.data._id.$oid.toString() || $scope.model._id.$oid.toString();
        var url = '/api/upload_product_image/' + product_id;
        uploader.url = url;
        if (uploader.queue.length > 0) {
          uploader.queue[0].url = url;
          uploader.queue[0].upload();
        } else {
          console.log("save product success!")
          $location.url(returnUrl);
        }
      } else {
        alert(data.message);
      }
    }).error(function (e) {
      alert(e);
      console.log(e);
    })
  };
});
